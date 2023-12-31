import assert from 'assert'
import fp from 'fastify-plugin'
import fs from 'node:fs'
import { parse } from 'csv-parse'

const PNL_SUMMARY_GROUPS = ['day', 'week', 'month', 'year']
const TOTAL_PNL_VIEW = 'pnl_summary'
const TOTAL_PNL_VIEW_BY_TYPE = 'pnl_summary_by_trade_type'
const PNL_WINDOWS = 'pnl_windows_profile'

async function tradesPlugin (fastify) {
  // Parsing functions
  const parseTradeQuantity = (row) => parseInt(row['Trade Quantity'], 10)
  const parseEntryPrice = (row) => parseFloat(row['Entry Price'])
  const parseExitPrice = (row) => parseFloat(row['Exit Price'])
  const parseMaxOpenQuantity = (row) => parseInt(row['Max Open Quantity'], 10)
  const parseMaxClosedQuantity = (row) => parseInt(row['Max Closed Quantity'], 10)
  const pnl = (row) => parseFloat(row['Profit/Loss (P)']) || null
  const parseTime = (dateTime) => new Date(dateTime.replace('  ', 'T').replace(/ EP|BP/, '').trim())

  // returns time difference in seconds
  const parseDuration = (row) => {
    const entryDateTime = parseTime(row['Entry DateTime'])
    const exitDateTime = parseTime(row['Exit DateTime'])

    return (exitDateTime.getTime() - entryDateTime.getTime()) / 1000
  }

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

  const parseTrade = (row) => ({
    symbol: row.Symbol,
    tradeType: row['Trade Type'],
    entryDateTime: parseTime(row['Entry DateTime']),
    entryPrice: parseEntryPrice(row),
    tradeQuantity: parseTradeQuantity(row),
    pnl: pnl(row),
    tradeStatus: pnl(row) > 0 ? 'Win' : 'Lose',
    exitDateTime: null,
    exitPrice: null,
    maxOpenQuantity: parseMaxOpenQuantity(row),
    account: row.Account || 'default',
    steps: [] // To store the additions or partial exits
  })

  const updateTrade = (trade, row) => {
    const newMaxOpenQuantity = parseMaxOpenQuantity(row)
    const action = newMaxOpenQuantity > trade.maxOpenQuantity ? 'Added to Trade' : 'Took Profits'

    trade.steps.push({
      dateTime: parseTime(row['Exit DateTime']),
      price: parseExitPrice(row),
      quantity: parseTradeQuantity(row),
      action
    })

    return trade
  }

  const closeTrade = (trade, row) => {
    trade.exitDateTime = parseTime(row['Exit DateTime'])
    trade.exitPrice = parseExitPrice(row)
    trade.tradeQuantity = parseMaxClosedQuantity(row)
    trade.duration = parseDuration(row)
    trade.steps.push({
      dateTime: parseTime(row['Exit DateTime']),
      price: parseExitPrice(row),
      quantity: parseTradeQuantity(row),
      action: 'Took Profits'
    })

    return trade
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

  // Consolidation function
  const consolidateTrades = (records) => {
    let currentTrade = null
    const consolidatedTrades = []

    for (const row of records) {
      if (row['Entry DateTime'].includes('BP')) {
        if (currentTrade) {
          consolidatedTrades.push(currentTrade)
        }
        currentTrade = parseTrade(row)
      }

      if (row['Exit DateTime'].includes('EP')) {
        currentTrade = closeTrade(currentTrade, row)
        consolidatedTrades.push(currentTrade)
        currentTrade = null
      }

      if (currentTrade) {
        currentTrade = updateTrade(currentTrade, row)
      }
    }

    if (currentTrade) {
      consolidatedTrades.push(currentTrade)
    }
    return consolidatedTrades
  }

  const processTrades = async (filePath) => {
    const parser = fs.createReadStream(filePath).pipe(parse({
      columns: true,
      delimiter: '\t',
      relax_column_count: true
    }))

    const records = []
    for await (const record of parser) {
      records.push(record)
    }

    return consolidateTrades(records)
  }

  const processAndInsertTrades = async (filePath, user) => {
    // Check if user is authenticated
    if (!user) {
      throw new Error('User not authenticated')
    }
    try {
      // Process trades
      const consolidatedTrades = await processTrades(filePath)
      // Insert trades into the database
      await createMultipleTrades(consolidatedTrades, user)
      return consolidatedTrades
    } catch (error) {
      fastify.log.error(error, 'Error processing trades')
      throw error
    }
  }

  // const calculatePnlWindows = (trades) => {
  //   const windows = []
  //   for (const trade of trades) {
  //     const { entryDateTime, pnl } = trade
  //     const entryHour = entryDateTime.getHours()
  //     const entryMinute = entryDateTime.getMinutes()
  //     const windowIndex = Math.floor((entryHour - 9) * 2 + entryMinute / 30)
  //     if (windowIndex >= 0 && windowIndex <= 29) {
  //       if (!windows[windowIndex]) {
  //         windows[windowIndex] = []
  //       }
  //       windows[windowIndex].push({ pnl })
  //     }
  //   }
  //   const results = []
  //   const letter = 'A'.charCodeAt(0)
  //   for (let i = 0; i < 30; i++) {
  //     const window = windows[i] || []
  //     const pnl = window.reduce((acc, trade) => acc + trade.pnl, 0)
  //     const hour = Math.floor(i / 2) + 9
  //     const minute = (i % 2) * 30
  //     if (hour >= 9 && hour < 16 && pnl !== 0) {
  //       const letterIndex = i - 1
  //       const periodLetter = letterIndex >= 0 && letterIndex < 13 ? String.fromCharCode(letter + letterIndex) : ''
  //       if (hour === 9 && minute < 30) {
  //         results.push({ hour, minute, pnl, periodLetter: '' })
  //       } else {
  //         results.push({ hour, minute, pnl, periodLetter })
  //       }
  //     }
  //   }
  //   results.sort((a, b) => b.pnl - a.pnl)
  //   return results
  // }

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

  const getTradesByEntryDateTime = async (user, start, end = Date.now()) => {
    // Get trades for user within the given entryDateTime range
    const client = await fastify.pg.connect()
    try {
      const getTradesByEntryDateTimeQuery = 'SELECT * FROM trades WHERE user=$1 AND entryDateTime >= $2 AND entryDateTime <= $3'
      const result = await fastify.pg.query(getTradesByEntryDateTimeQuery, [user, start, end])
      return result.rows
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getTradesByEntryDateTime')
      throw err
    } finally {
      client.release()
    }
  }

  const parseTradeTime = (date) => {
    return new Date(date).toString()
  }

  const returnParsedTrades = (trades) => {
    return trades.map((trade) => {
      const {
        entrydatetime: entryDateTime,
        exitdatetime: exitDateTime,
        steps, created_at: createdAt,
        updated_at: updatedAt,
        profile_id: profileId,
        ...rest
      } = trade
      return {
        ...rest,
        profileId,
        createdAt: parseTradeTime(createdAt),
        updatedAt: parseTradeTime(updatedAt),
        entryDateTime: parseTradeTime(entryDateTime),
        exitDateTime: exitDateTime ? parseTradeTime(exitDateTime) : null,
        steps: steps.map((step) => {
          const { dateTime, ...rest } = step
          return {
            ...rest,
            dateTime: new Date(dateTime)
          }
        })
      }
    })
  }

  const getTradesforUser = async (user) => {
    // Get trades for user
    const client = await fastify.pg.connect()
    try {
      const getTradesQuery = 'SELECT * FROM trades WHERE profile_id=$1 ORDER BY entryDateTime DESC'
      const { rows } = await fastify.pg.query(getTradesQuery, [user.id])
      return returnParsedTrades(rows)
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getTradesforUser')
      throw err
    } finally {
      client.release()
    }
  }

  const viewChooser = (group) => {
    switch (group) {
      case 'day':
        return 'daily_pnl_summary'
      case 'week':
        return 'weekly_pnl_summary'
      case 'month':
        return 'monthly_pnl_summary'
      case 'year':
        return 'yearly_pnl_summary'
      default:
        return 'daily_pnl_summary'
    }
  }

  const getUserPnlStats = async (user, group = 'day') => {
    // Get trades for user
    assert(PNL_SUMMARY_GROUPS, 'Invalid group')
    const client = await fastify.pg.connect()
    try {
      const viewName = viewChooser(group) // Replace with the name of your view
      const getPnlSummaryQ = `SELECT ${group}, total_pnl FROM ${viewName} WHERE profile_id = $1 GROUP BY ${group}, total_pnl ORDER BY ${group} DESC`
      const { rows } = await fastify.pg.query(getPnlSummaryQ, [user.id])
      return rows
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getUserPnlStats')
      throw err
    } finally {
      client.release()
    }
  }

  const getTradesById = async (user, id) => {
    // Get trades for user
    const client = await fastify.pg.connect()
    try {
      const getTradesQuery = 'SELECT * FROM trades WHERE profile_id=$1 AND id=$2'
      const { rows } = await fastify.pg.query(getTradesQuery, [user.id, id])
      return returnParsedTrades(rows)
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getTradesById')
      throw err
    } finally {
      client.release()
    }
  }

  const getUserTotalPnl = async (user) => {
    // Get trades for user
    const client = await fastify.pg.connect()
    try {
      const viewName = TOTAL_PNL_VIEW
      const getPnlSummaryQ = `SELECT SUM(total_pnl) FROM ${viewName} WHERE profile_id = $1`
      const { rows } = await fastify.pg.query(getPnlSummaryQ, [user.id])
      return rows
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getUserTotalPnl')
      throw err
    } finally {
      client.release()
    }
  }

  const getUserTotalPnlByType = async (user) => {
    // Get trades for user
    // TODO: set toIsoString for each date
    const client = await fastify.pg.connect()
    try {
      const viewName = TOTAL_PNL_VIEW_BY_TYPE
      const getPnlSummaryQ = `SELECT SUM(total_pnl) FROM ${viewName} WHERE profile_id = $1`
      const { rows } = await fastify.pg.query(getPnlSummaryQ, [user.id])
      return rows
    } catch (err) {
      fastify.log.error(err, 'Error getting trades in getUserTotalPnlByType')
      throw err
    } finally {
      client.release()
    }
  }

  const getUserPnlWindows = async (user) => {
    // Get trades for user
    const client = await fastify.pg.connect()
    try {
      const getPnlSummaryQ = `
        SELECT
          *
        FROM ${PNL_WINDOWS}
        WHERE profile_id = $1
        ORDER BY pnl DESC
    `
      const { rows } = await fastify.pg.query(getPnlSummaryQ, [user.id])
      return rows.map(row => ({
        profileId: row.profile_id,
        windowLetter: row.window_letter,
        pnl: row.pnl
      }))
    } catch (err) {
      fastify.log.error(err, 'Error getting pnl windows in getUserPnlWindows')
      throw err
    } finally {
      client.release()
    }
  }

  const tradeMethods = {
    createTrade,
    createMultipleTrades,
    deleteTradesById,
    getTradesByEntryDateTime,
    getTradesById,
    getTradesforUser,
    getUserPnlStats,
    processAndInsertTrades,
    getUserTotalPnl,
    getUserTotalPnlByType,
    getUserPnlWindows
  }

  fastify.decorate('tradeMethods', tradeMethods)
}

export default fp(tradesPlugin, { name: 'tradeMethods' })
