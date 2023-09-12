import fp from 'fastify-plugin'
import fs from 'node:fs'
import readline from 'node:readline'

async function tradesPlugin (fastify) {
  const createTradeInsert = (trade, user, client) => {
    const {
      symbol,
      tradeType,
      entryDateTime,
      entryPrice,
      tradeQuantity,
      pnl,
      tradeStatus,
      exitDateTime,
      exitPrice,
      maxOpenQuantity,
      account,
      steps,
      duration
    } = trade
    return client.query(
      'INSERT INTO trades (profile_id, symbol, tradeType, entryDateTime, entryPrice, tradeQuantity, pnl, tradeStatus, exitDateTime, exitPrice, maxOpenQuantity, account, steps, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [user.id, symbol, tradeType, entryDateTime, entryPrice, tradeQuantity, pnl, tradeStatus, exitDateTime, exitPrice, maxOpenQuantity, account, JSON.stringify(steps), duration]
    )
  }

  const createTrade = async (trade, user) => {
    // Insert trade into the database
    const client = await fastify.pg.connect()
    try {
      await client.query('BEGIN')
      createTradeInsert(trade, user, client)
      client.query('COMMIT')
      fastify.log.info('Trade inserted successfully')
    } catch (error) {
      client.query('ROLLBACK')
      fastify.log.error(error, 'Error inserting trade in createTrade')
      throw error
    } finally {
      client.release()
    }
  }

  const createMultipleTrades = async (trades, user) => {
    // Insert trades into the database using transactions

    const client = await fastify.pg.connect()

    try {
      await client.query('BEGIN')
      for (const trade of trades) {
        createTradeInsert(trade, user, client)
      }
      client.query('COMMIT')
      fastify.log.info('Trades inserted successfully')
    } catch (error) {
      client.query('ROLLBACK')
      fastify.log.error(error, 'Error inserting trades in createMultipleTrades')
      throw error
    } finally {
      client.release()
    }
  }

  const processAndInsertTrades = async (filePath, user) => {
    // Check if user is authenticated
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // Process trades
      const consolidatedTrades = []
      const readStream = fs.createReadStream(filePath)
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity
      })

      for await (const line of rl) {
        const [timestamp, symbol, quantity, price] = line.split('\t')
        const trade = {
          timestamp: new Date(timestamp),
          symbol,
          quantity: parseInt(quantity),
          price: parseFloat(price)
        }

        consolidatedTrades.push(trade)
      }

      // Insert trades into the database
      return createMultipleTrades(consolidatedTrades, user)
    } catch (error) {
      fastify.log.error(error, 'Error processing trades')
      throw error
    }
  }

  const calculatePnlWindows = (trades) => {
    const windows = []
    for (const trade of trades) {
      const { entryDateTime, pnl } = trade
      const entryHour = entryDateTime.getHours()
      const entryMinute = entryDateTime.getMinutes()
      const windowIndex = Math.floor((entryHour - 9) * 2 + entryMinute / 30)
      if (windowIndex >= 0 && windowIndex <= 29) {
        if (!windows[windowIndex]) {
          windows[windowIndex] = []
        }
        windows[windowIndex].push({ pnl })
      }
    }
    const results = []
    const letter = 'A'.charCodeAt(0)
    for (let i = 0; i < 30; i++) {
      const window = windows[i] || []
      const pnl = window.reduce((acc, trade) => acc + trade.pnl, 0)
      const hour = Math.floor(i / 2) + 9
      const minute = (i % 2) * 30
      if (hour >= 9 && hour < 16 && pnl !== 0) {
        const letterIndex = i - 1
        const periodLetter = letterIndex >= 0 && letterIndex < 13 ? String.fromCharCode(letter + letterIndex) : ''
        if (hour === 9 && minute < 30) {
          results.push({ hour, minute, pnl, periodLetter: '' })
        } else {
          results.push({ hour, minute, pnl, periodLetter })
        }
      }
    }
    results.sort((a, b) => b.pnl - a.pnl)
    return results
  }

  const deleteTradesById = async (user, tradeIds) => {
    // Delete trades for user
    const client = await fastify.pg.transact()
    try {
      await client.query('BEGIN')
      for (const tradeId of tradeIds) {
        const deleteTradesByIdQuery = 'DELETE FROM trades WHERE user=$1 AND id=$2'
        await client.query(deleteTradesByIdQuery, [user, tradeId])
      }
      client.query('COMMIT')
      fastify.log.info('Trades deleted successfully')
      return tradeIds
    } catch (error) {
      client.query('ROLLBACK')
      fastify.log.error(error, 'Error deleting trades in deleteTradesById')
      throw error
    } finally {
      client.release()
    }
  }

  const getTradesByEntryDateTime = async (user, start, end) => {
    // Get trades for user within the given entryDateTime range
    const getTradesByEntryDateTimeQuery = 'SELECT * FROM trades WHERE user=$1 AND entryDateTime >= $2 AND entryDateTime <= $3'
    const result = await fastify.pg.query(getTradesByEntryDateTimeQuery, [user, start, end])
    return result.rows
  }

  fastify.decorate('calculatePnlWindows', calculatePnlWindows)
  fastify.decorate('getTradesByEntryDateTime', getTradesByEntryDateTime)
  fastify.decorate('createTrade', createTrade)
  fastify.decorate('createMultipleTrades', createMultipleTrades)
  fastify.decorate('processAndInsertTrades', processAndInsertTrades)
  fastify.decorate('deleteTradesById', deleteTradesById)
}

export default fp(tradesPlugin, { name: 'tradeMethods' })
