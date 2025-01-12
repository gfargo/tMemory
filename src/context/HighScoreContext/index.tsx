import Conf from 'conf'
import React, { createContext, useContext } from 'react'
import { GameMode, GridDimension, HighScore } from "../../types/game.js"
import { HighScoreConfig, HighScoreContextValue } from "./types.js"

// Initialize Conf with schema validation
const config = new Conf<HighScoreConfig>({
  projectName: 'tmemory',
  schema: {
    scores: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          time: { type: 'number', minimum: 0 },
          rows: { type: 'number', minimum: 1, maximum: 12 },
          cols: { type: 'number', minimum: 1, maximum: 12 },
          gameMode: { type: 'string', enum: ['single', 'vs-ai', 'vs-player'] },
          date: { type: 'string', format: 'date-time' },
        },
        required: ['time', 'rows', 'cols', 'gameMode', 'date'],
        additionalProperties: false,
      },
      default: {},
    },
  },
  clearInvalidConfig: true, // This will clear any invalid config data
})

const getHighScoreKey = (grid: GridDimension, mode: GameMode): string => {
  return `${grid.rows}x${grid.cols}-${mode}`
}

const HighScoreContext = createContext<HighScoreContextValue | undefined>(undefined)

export const HighScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const getAllHighScores = (): Record<string, HighScore> => {
    return (config.get('scores') as unknown) as Record<string, HighScore>
  }

  const getHighScore = (mode: GameMode, grid: GridDimension): HighScore | null => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(grid, mode)
    return scores[key] || null
  }

  const saveHighScore = (score: HighScore) => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(
      { rows: score.rows, cols: score.cols },
      score.gameMode
    )
    scores[key] = score
    config.set('scores', scores)
  }

  const isNewHighScore = (
    time: number,
    grid: GridDimension,
    mode: GameMode
  ): boolean => {
    const currentHighScore = getHighScore(mode, grid)
    return !currentHighScore || time < currentHighScore.time
  }

  const value: HighScoreContextValue = {
    getHighScore,
    saveHighScore,
    isNewHighScore,
    getAllHighScores,
  }

  return (
    <HighScoreContext.Provider value={value}>
      {children}
    </HighScoreContext.Provider>
  )
}

export const useHighScores = () => {
  const context = useContext(HighScoreContext)
  if (context === undefined) {
    throw new Error('useHighScores must be used within a HighScoreProvider')
  }
  return context
}