import fp from 'fastify-plugin'
import fs from 'node:fs'

async function tradesPlugin(fastify) {

  const createTrade = async (trade, user, trx) => {
    const client = await fastify.pg.connect();
    try {
      const result = await client.query(
        'INSERT INTO trades (profile_id, symbol, tradeType, entryDateTime, entryPrice, tradeQuantity, pnl, tradeStatus, exitDateTime, exitPrice, maxOpenQuantity, account, steps, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
        [profile_id, symbol, tradeType, entryDateTime, entryPrice, tradeQuantity, pnl, tradeStatus, exitDateTime, exitPrice, maxOpenQuantity, account, steps, duration]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  const insertTrade = async (trade, user, trx) => {
    // Insert trade into the database
    await createTrade(trade, user, trx)

    // Recalculate PNL windows and win loss ratio
    const trades = await fastify.db.getTrades(user, trx)
  }

  const processTrades = async (filePath, user) => {
    // Check if user is authenticated
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Start transaction
    const trx = await fastify.db.transaction()

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

        // Insert trade into the database
        await fastify.db.insertTrade(trade, user, trx)

        consolidatedTrades.push(trade)
      }

      // Commit transaction
      await trx.commit()

      return consolidatedTrades
    } catch (error) {
      // Rollback transaction on error
      await trx.rollback()
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

  const getTradesByEntryDateTime = async (user, start, end) => {
    // Get trades for user within the given entryDateTime range
    const getTradesByEntryDateTimeQuery = 'SELECT * FROM trades WHERE user=$1 AND entryDateTime >= $2 AND entryDateTime <= $3'
    const result = await fastify.pg.query(getTradesByEntryDateTimeQuery, [user, start, end])
    return result.rows
  }

  fastify.decorate('calculatePnlWindows', calculatePnlWindows)
  fastify.decorate('getTradesByEntryDateTime', getTradesByEntryDateTime)
  fastify.decorate('insertTrade', insertTrade)
  fastify.decorate('processTrades', processTrades)

}

export default fp(tradesPlugin, { name: 'tradeMethods' })
