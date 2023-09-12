import { test } from 'tap'
import { fileURLToPath } from 'node:url'
import { calculatePnlWindows, calculatePnl, calculateWinLossRatio, consolidateTrades, processTrades } from './index.mjs'

test('calculatePnlWindows', (t) => {
  const trades = [
    { entryDateTime: new Date('2022-01-01T09:00:00'), exitDateTime: new Date('2022-01-01T10:00:00'), pnl: 100 },
    { entryDateTime: new Date('2022-01-01T09:30:00'), exitDateTime: new Date('2022-01-01T10:30:00'), pnl: 200 },
    { entryDateTime: new Date('2022-01-01T10:00:00'), exitDateTime: new Date('2022-01-01T11:00:00'), pnl: 300 },
    { entryDateTime: new Date('2022-01-01T10:30:00'), exitDateTime: new Date('2022-01-01T11:30:00'), pnl: 400 },
    { entryDateTime: new Date('2022-01-01T11:00:00'), exitDateTime: new Date('2022-01-01T12:00:00'), pnl: 500 },
    { entryDateTime: new Date('2022-01-01T11:30:00'), exitDateTime: new Date('2022-01-01T12:30:00'), pnl: 600 },
    { entryDateTime: new Date('2022-01-01T12:00:00'), exitDateTime: new Date('2022-01-01T13:00:00'), pnl: 700 },
    { entryDateTime: new Date('2022-01-01T12:30:00'), exitDateTime: new Date('2022-01-01T13:30:00'), pnl: 800 },
    { entryDateTime: new Date('2022-01-01T13:00:00'), exitDateTime: new Date('2022-01-01T14:00:00'), pnl: 900 },
    { entryDateTime: new Date('2022-01-01T13:30:00'), exitDateTime: new Date('2022-01-01T14:30:00'), pnl: 1000 }
  ]
  const expectedResults = [
    { hour: 9, minute: 0, pnl: 100, periodLetter: '' },
    { hour: 9, minute: 30, pnl: 200, periodLetter: 'A' },
    { hour: 10, minute: 0, pnl: 300, periodLetter: 'B' },
    { hour: 10, minute: 30, pnl: 400, periodLetter: 'C' },
    { hour: 11, minute: 0, pnl: 500, periodLetter: 'D' },
    { hour: 11, minute: 30, pnl: 600, periodLetter: 'E' },
    { hour: 12, minute: 0, pnl: 700, periodLetter: 'F' },
    { hour: 12, minute: 30, pnl: 800, periodLetter: 'G' },
    { hour: 13, minute: 0, pnl: 900, periodLetter: 'H' },
    { hour: 13, minute: 30, pnl: 1000, periodLetter: 'I' }
  ].sort((a, b) => b.pnl - a.pnl)

  const results = calculatePnlWindows(trades)
  t.same(results, expectedResults)
  t.end()
})

test('calculatePnl', (t) => {
  const trades = [
    { entryPrice: 100, exitPrice: 110, quantity: 100 },
    { entryPrice: 90, exitPrice: 80, quantity: 200 },
    { entryPrice: 120, exitPrice: 130, quantity: 50 }
  ]
  const expectedPnl = 1000 - 2000 + 500
  const pnl = calculatePnl(trades)
  t.equal(pnl, expectedPnl)
  t.end()
})

test('calculateWinLossRatio', (t) => {
  const trades = [
    { entryPrice: 100, exitPrice: 110, quantity: 100, pnl: 1000 },
    { entryPrice: 90, exitPrice: 80, quantity: 200, pnl: -2000 },
    { entryPrice: 120, exitPrice: 130, quantity: 50, pnl: 500 }
  ]
  const expectedWinLossRatio = parseFloat(0.667).toFixed(3)
  const winLossRatio = calculateWinLossRatio(trades)
  t.equal(winLossRatio, expectedWinLossRatio)
  t.end()
})

test('consolidateTrades', (t) => {
  const records = [
    { Symbol: 'AAPL', 'Trade Type': 'Long', 'Entry DateTime': '2022-01-01 09:00:00 BP', 'Exit DateTime': '2022-01-01 10:00:00 EP', 'Entry Price': '100', 'Exit Price': '110', 'Trade Quantity': '100', 'Max Open Quantity': '100', 'Max Closed Quantity': '100', 'Profit/Loss (P)': '1000', 'Cumulative Profit/Loss (P)': '1000', 'FlatToFlat Profit/Loss (P)': '1000', 'FlatToFlat Max Open Profit (P)': '1000', 'FlatToFlat Max Open Loss (P)': '1000', 'Max Open Profit (P)': '1000', 'Max Open Loss (P)': '1000', 'Entry Efficiency': '100.0 %', 'Exit Efficiency': '0.0 %', 'Total Efficiency': '100.0 %', 'Commission (C)': '0.00', 'High Price While Open': '110', 'Low Price While Open': '100', Note: '', 'Open Position Quantity': '0', 'Close Position Quantity': '0', Duration: '00:00:00', Account: 'default' },
    { Symbol: 'AAPL', 'Trade Type': 'Long', 'Entry DateTime': '2022-01-01 10:00:00 BP', 'Exit DateTime': '2022-01-01 11:00:00 EP', 'Entry Price': '120', 'Exit Price': '130', 'Trade Quantity': '50', 'Max Open Quantity': '50', 'Max Closed Quantity': '50', 'Profit/Loss (P)': '500', 'Cumulative Profit/Loss (P)': '1500', 'FlatToFlat Profit/Loss (P)': '500', 'FlatToFlat Max Open Profit (P)': '500', 'FlatToFlat Max Open Loss (P)': '500', 'Max Open Profit (P)': '500', 'Max Open Loss (P)': '500', 'Entry Efficiency': '100.0 %', 'Exit Efficiency': '0.0 %', 'Total Efficiency': '100.0 %', 'Commission (C)': '0.00', 'High Price While Open': '130', 'Low Price While Open': '120', Note: '', 'Open Position Quantity': '0', 'Close Position Quantity': '0', Duration: '00:00:00', Account: 'default' },
    { Symbol: 'AAPL', 'Trade Type': 'Long', 'Entry DateTime': '2022-01-01 11:00:00 BP', 'Exit DateTime': '2022-01-01 12:00:00 EP', 'Entry Price': '140', 'Exit Price': '130', 'Trade Quantity': '75', 'Max Open Quantity': '75', 'Max Closed Quantity': '75', 'Profit/Loss (P)': '-825', 'Cumulative Profit/Loss (P)': '675', 'FlatToFlat Profit/Loss (P)': '-825', 'FlatToFlat Max Open Profit (P)': '-825', 'FlatToFlat Max Open Loss (P)': '-825', 'Max Open Profit (P)': '-825', 'Max Open Loss (P)': '-825', 'Entry Efficiency': '100.0 %', 'Exit Efficiency': '0.0 %', 'Total Efficiency': '100.0 %', 'Commission (C)': '0.00', 'High Price While Open': '140', 'Low Price While Open': '130', Note: '', 'Open Position Quantity': '0', 'Close Position Quantity': '0', Duration: '00:00:00', Account: 'default' }
  ]

  const expectedTrades = [
    { symbol: 'AAPL', tradeType: 'Long', entryDateTime: new Date('2022-01-01T09:00:00'), entryPrice: 100, tradeQuantity: 100, pnl: 1000, status: 'Win', exitDateTime: new Date('2022-01-01T10:00:00'), exitPrice: 110, maxOpenQuantity: 100, account: 'default', steps: [] },
    { symbol: 'AAPL', tradeType: 'Long', entryDateTime: new Date('2022-01-01T10:00:00'), entryPrice: 120, tradeQuantity: 50, pnl: 500, status: 'Win', exitDateTime: new Date('2022-01-01T11:00:00'), exitPrice: 130, maxOpenQuantity: 50, account: 'default', steps: [] },
    { symbol: 'AAPL', tradeType: 'Long', entryDateTime: new Date('2022-01-01T11:00:00'), entryPrice: 140, tradeQuantity: 75, pnl: -825, status: 'Lose', exitDateTime: new Date('2022-01-01T12:00:00'), exitPrice: 130, maxOpenQuantity: 75, account: 'default', steps: [] }
  ]

  const trades = consolidateTrades(records)
  t.match(trades, expectedTrades)
  t.end()
})

test('processTrades', async (t) => {
  const ORIGINAL_CONSOLE_LOG = console.log
  console.log = () => {}
  t.after = () => {
    console.log = ORIGINAL_CONSOLE_LOG
  }

  const filePath = new URL('../data/demo.tsv', import.meta.url)
  const absolutePath = fileURLToPath(filePath)
  const trades = await processTrades(absolutePath)
  t.ok(trades.length > 0)
  t.end()
})
