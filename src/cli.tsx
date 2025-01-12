#!/usr/bin/env node
import { render } from 'ink'
import meow from 'meow'
import React from 'react'
import App from './App.js'

const cli = meow(
  `
  🃏 tMemory - A terminal-based Memory card game

  Usage
    $ tmemory [options]

  Options
    --mode, -m     Start with specific game mode (1p/2p/ai)
    --grid, -g     Start with specific grid size (e.g., "4x4", "2x6")
    --help         Show this help message
    --version      Show version number

  Examples
    $ tmemory
    $ tmemory --mode 2p
    $ tmemory --grid 4x4
    $ tmemory -m ai -g 6x6

  Game Modes
    • 1p        - Single player mode
    • 2p        - Two players taking turns
    • ai        - Play against the computer

  Grid Sizes
    • Square:      2x2, 4x4, 6x6, 8x8, 10x10, 12x12
    • Rectangular: 2x4, 2x6, 3x6, 3x8
    • Custom:      Any valid combination up to 12x12

  Controls
    • G           - Change game mode
    • M           - Switch between preset/custom grid modes
    • ↑/↓/←/→     - Navigate cards/adjust grid size
    • Space       - Flip card/start game
    • N           - New game (after game over)
    • Q           - Quit game
`,
  {
    importMeta: import.meta,
    flags: {
      mode: {
        type: 'string',
        alias: 'm',
        choices: ['1p', '2p', 'ai'],
      },
      grid: {
        type: 'string',
        alias: 'g',
        validate: (value: string) => {
          const match = value.match(/^(\d+)x(\d+)$/)
          if (!match || !match[1] || !match[2]) return false
          const r = parseInt(match[1], 10)
          const c = parseInt(match[2], 10)
          return (
            r > 0 &&
            c > 0 &&
            r <= 12 &&
            c <= 12 &&
            (r * c) % 2 === 0 && // Must be even number of cards
            r * c <= 144 // Max total cards
          )
        },
      },
    },
  }
)

// Convert short mode names to full names
const modeMap = {
  '1p': 'single',
  '2p': 'vs-player',
  ai: 'vs-ai',
} as const

// Parse grid size if provided
const initialGrid =
  cli.flags.grid
    ?.match(/^(\d+)x(\d+)$/)
    ?.slice(1)
    .map(Number) || null

render(
  <App
    initialMode={
      cli.flags.mode
        ? modeMap[cli.flags.mode as keyof typeof modeMap]
        : undefined
    }
    initialGrid={
      initialGrid
        ? { rows: initialGrid[0] as number, cols: initialGrid[1] as number }
        : undefined
    }
  />
)
