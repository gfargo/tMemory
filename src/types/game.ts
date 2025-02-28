import type { TCardValue, TSuit } from 'ink-playing-cards'

export type GameMode = 'single' | 'vs-player' | 'vs-ai'
export type Player = 'p1' | 'p2' | 'ai'
export type GameState = 'welcome' | 'playing' | 'gameover' | 'leaderboard'
export type GridSelectionMode = 'preset' | 'custom'

export interface GridDimension {
  rows: number
  cols: number
}

export interface GameCard {
  suit: TSuit
  value: TCardValue
  faceUp: boolean
  selected?: boolean
}

export interface GameScores {
  p1: number
  p2: number
  ai: number
}

export interface HighScore {
  time: number
  rows: number
  cols: number
  gameMode: GameMode
  date: string
  playerName?: string
  deviceId?: string
  isOnline?: boolean
}

export type Winner = 'Player' | 'P1' | 'P2' | 'AI' | 'Nobody'

export interface GameContextState {
  gameState: GameState
  gameMode: GameMode
  gridDimension: GridDimension
  gridSelectionMode: GridSelectionMode
  currentPresetIndex: number
  grid: GameCard[]
  flippedIndices: number[]
  matchedIndices: number[]
  currentPlayer: Player
  scores: GameScores
  selectedIndex: number
  message: string
  startTime: number
  endTime: number
  winner: Winner
  shouldTrackScore: boolean
  isNewRecord: boolean
}