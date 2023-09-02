import fs from 'fs'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { parse } from 'csv-parse'

// Parsing functions
const parseTradeQuantity = (row) => parseInt(row['Trade Quantity'], 10)
const parseEntryPrice = (row) => parseFloat(row['Entry Price'])
const parseExitPrice = (row) => parseFloat(row['Exit Price'])
const parseMaxOpenQuantity = (row) => parseInt(row['Max Open Quantity'], 10)
const parseMaxClosedQuantity = (row) => parseInt(row['Max Closed Quantity'], 10)
const pnl = (row) => parseFloat(row['Profit/Loss (P)'])
const parseTime = (dateTime) => new Date(dateTime.replace('  ', 'T').replace(/ EP|BP/, '').trim())

// returns time difference in seconds
const parseDuration = (row) => {
  const entryDateTime = parseTime(row['Entry DateTime'])
  const exitDateTime = parseTime(row['Exit DateTime'])

  return (exitDateTime.getTime() - entryDateTime.getTime()) / 1000
}

// Trade functions
const createTrade = (row) => ({
  tradeId: randomUUID(),
  symbol: row.Symbol,
  tradeType: row['Trade Type'],
  entryDateTime: parseTime(row['Entry DateTime']),
  entryPrice: parseEntryPrice(row),
  tradeQuantity: parseTradeQuantity(row),
  pnl: pnl(row),
  status: pnl(row) > 0 ? 'Win' : 'Lose',
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

// Consolidation function
export const consolidateTrades = (records) => {
  let currentTrade = null
  const consolidatedTrades = []

  for (const row of records) {
    if (row['Entry DateTime'].includes('BP')) {
      if (currentTrade) {
        consolidatedTrades.push(currentTrade)
      }
      currentTrade = createTrade(row)
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

export function calculatePnlWindows (trades) {
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

// Main function
export const processTrades = async (filePath) => {
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

export function calculateWinLossRatio (trades) {
  let numWinningTrades = 0
  for (const trade of trades) {
    if (trade.pnl > 0) {
      numWinningTrades++
    }
  }

  if (numWinningTrades - trades.length === 0) {
    return 1
  } else {
    return parseFloat(numWinningTrades / trades.length).toFixed(3)
  }
}

// Usage
const filePath = new URL('../data/demo.tsv', import.meta.url)
const absolutePath = fileURLToPath(filePath)

async function main () {
  try {
    const consolidatedTrades = await processTrades(absolutePath)
    console.log(consolidatedTrades.at(-1))
    console.log(calculatePnlWindows(consolidatedTrades))
    console.log(calculateWinLossRatio(consolidatedTrades))
  } catch (error) {
    console.error(error)
  }
}

main()
