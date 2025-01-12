import { GameMode, GridDimension, HighScore } from "../../types/game.js"

export interface HighScoreContextValue {
  getHighScore: (mode: GameMode, grid: GridDimension) => HighScore | null
  saveHighScore: (score: HighScore) => void
  isNewHighScore: (time: number, grid: GridDimension, mode: GameMode) => boolean
  getAllHighScores: () => Record<string, HighScore>
}

export interface HighScoreConfig {
  scores: {
    type: 'object'
    additionalProperties: {
      type: 'object'
      properties: {
        time: { type: 'number' }
        gridSize: { type: 'number' }
        gameMode: { type: 'string'; enum: GameMode[] }
        date: { type: 'string' }
      }
      required: string[]
    }
    default: Record<string, never>
  }
}