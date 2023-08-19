import { test } from 'tap'
import { calculatePnlWindows } from './index.mjs'

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
    { entryDateTime: new Date('2022-01-01T13:30:00'), exitDateTime: new Date('2022-01-01T14:30:00'), pnl: 1000 },
  ]
  const expectedResults = [
    { hour: 9, minute: 30, pnl: 200, letter: 'A' },
    { hour: 10, minute: 0, pnl: 400, letter: 'B' },
    { hour: 10, minute: 30, pnl: 600, letter: 'C' },
    { hour: 11, minute: 0, pnl: 900, letter: 'D' },
    { hour: 11, minute: 30, pnl: 1200, letter: 'E' },
    { hour: 12, minute: 0, pnl: 1500, letter: 'F' },
    { hour: 12, minute: 30, pnl: 1800, letter: 'G' },
    { hour: 13, minute: 0, pnl: 2200, letter: 'H' },
    { hour: 13, minute: 30, pnl: 2600, letter: 'I' },
    { hour: 14, minute: 0, pnl: 3000, letter: 'J' },
    { hour: 14, minute: 30, pnl: 3400, letter: 'K' },
    { hour: 15, minute: 0, pnl: 3800, letter: 'L' },
  ]
  const results = calculatePnlWindows(trades)
  t.same(results, expectedResults)
  t.end()
})

test('calculatePnlWindows with empty trades', (t) => {
  const trades = []
  const expectedResults = []
  const results = calculatePnlWindows(trades)
  t.same(results, expectedResults)
  t.end()
})

test('calculatePnlWindows with single trade', (t) => {
  const trades = [{ entryDateTime: new Date('2022-01-01T09:00:00'), exitDateTime: new Date('2022-01-01T10:00:00'), pnl: 100 }]
  const expectedResults = [{ hour: 9, minute: 30, pnl: 100, letter: 'A' }]
  const results = calculatePnlWindows(trades)
  t.same(results, expectedResults)
  t.end()
})
