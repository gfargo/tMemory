import Conf from 'conf'
import React, { createContext, useContext } from 'react'
import { GameMode, GridDimension, HighScore } from "../../types/game.js"
import { HighScoreConfig, HighScoreContextValue } from "./types.js"

// Migrate old scores to new format
// const migrateOldScores = () => {
//   try {
//     const oldConfig = new Conf({ projectName: 'tmemory' })
//     const oldScores = oldConfig.get('scores') as Record<string, any>
    
//     // Convert old scores to new format
//     const newScores: Record<string, HighScore> = {}
    
//     Object.entries(oldScores).forEach(([key, score]) => {
//       if (!score) return
      
//       // Parse dimensions from key (format: "4x4-single")
//       const match = key.match(/^(\d+)x(\d+)-(.+)$/)
//       if (!match) return
      
//       const [, rows, cols, mode] = match
//       if (!rows || !cols || !mode) return
      
//       // Create new score with proper format
//       newScores[key] = {
//         time: score.time,
//         rows: parseInt(rows, 10),
//         cols: parseInt(cols, 10),
//         gameMode: mode as GameMode,
//         date: score.date || new Date().toISOString(),
//       }
//     })
    
//     // Clear old config
//     oldConfig.clear()
    
//     return newScores
//   } catch (error) {
//     console.error('Error migrating scores:', error)
//     return {}
//   }
// }

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

// // Migrate old scores if needed
// try {
//   const migratedScores = migrateOldScores()
//   if (Object.keys(migratedScores).length > 0) {
//     config.set('scores', migratedScores)
//   }
// } catch (error) {
//   console.error('Error setting migrated scores:', error)
// }

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