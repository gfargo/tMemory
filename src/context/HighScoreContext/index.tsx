import Conf from 'conf'
import React, { createContext, useContext } from 'react'
import { GameMode, GridDimension, HighScore } from '../../types/game.js'
import { getDeviceId } from '../../utils/device.js'
import { HighScoreConfig, HighScoreContextValue } from './types.js'

// Initialize Conf with schema validation
const config = new Conf<HighScoreConfig>({
  projectName: 'tmemory',
  schema: {
    scores: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            time: { type: 'number', minimum: 0 },
            rows: { type: 'number', minimum: 1, maximum: 12 },
            cols: { type: 'number', minimum: 1, maximum: 12 },
            gameMode: {
              type: 'string',
              enum: ['single', 'vs-ai', 'vs-player'],
            },
            date: { type: 'string', format: 'date-time' },
            playerName: { type: 'string', maxLength: 12 },
            deviceId: { type: 'string' },
            isOnline: { type: 'boolean' },
          },
          required: ['time', 'rows', 'cols', 'gameMode', 'date'],
          additionalProperties: false,
        },
        default: [],
      },
      default: {},
    },
    playerName: {
      type: 'string',
      default: '',
    },
    onlineEnabled: {
      type: 'boolean',
      default: false,
    },
  },
  clearInvalidConfig: true, // This will clear any invalid config data
})

const getHighScoreKey = (grid: GridDimension, mode: GameMode): string => {
  return `${grid.rows}x${grid.cols}-${mode}`
}

const HighScoreContext = createContext<HighScoreContextValue | undefined>(
  undefined
)

export const HighScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [onlineEnabled, setOnlineEnabled] = React.useState<boolean>(
    config.get('onlineEnabled') || false
  )

  const getAllHighScores = (): Record<string, HighScore[]> => {
    const scores = config.get('scores') as unknown as Record<
      string,
      HighScore | HighScore[]
    >

    // Handle migration from old format (single score) to new format (array of scores)
    const migratedScores: Record<string, HighScore[]> = {}

    for (const key in scores) {
      if (Array.isArray(scores[key])) {
        migratedScores[key] = scores[key] as HighScore[]
      } else if (scores[key]) {
        // Convert single score to array
        migratedScores[key] = [scores[key] as HighScore]
      } else {
        migratedScores[key] = []
      }
    }

    return migratedScores
  }

  const getHighScore = (
    mode: GameMode,
    grid: GridDimension
  ): HighScore | null => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(grid, mode)

    if (!scores[key] || scores[key].length === 0) {
      return null
    }

    // Return the best score (lowest time)
    return scores[key].reduce(
      (best, current) => (!best || current.time < best.time ? current : best),
      null as HighScore | null
    )
  }

  const saveHighScore = (score: HighScore) => {
    // Ensure the score has a deviceId and playerName
    const scoreWithDetails = {
      ...score,
      deviceId: score.deviceId || getDeviceId(),
      playerName: score.playerName || getPlayerName() || 'Anonymous',
      isOnline: score.isOnline || false,
    }

    const scores = getAllHighScores()
    const key = getHighScoreKey(
      { rows: score.rows, cols: score.cols },
      score.gameMode
    )

    // Initialize array if it doesn't exist
    if (!scores[key]) {
      scores[key] = []
    }

    // Add new score to the array
    scores[key].push(scoreWithDetails)

    // Sort by time (ascending) and keep only top 10
    scores[key] = scores[key].sort((a, b) => a.time - b.time).slice(0, 10)

    config.set('scores', scores)
  }

  const isNewHighScore = (
    time: number,
    grid: GridDimension,
    mode: GameMode
  ): boolean => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(grid, mode)

    // If we have fewer than 10 scores, it's a new high score
    if (!scores[key] || scores[key].length < 10) {
      return true
    }

    // Check if this time beats the worst time in the top 10
    const worstScore = [...scores[key]].sort((a, b) => a.time - b.time)[9]
    return worstScore ? time < worstScore.time : true
  }

  // Get local leaderboard for a specific mode and grid size
  const getLocalLeaderboard = (
    mode: GameMode,
    grid: GridDimension
  ): HighScore[] => {
    const key = getHighScoreKey(grid, mode)
    const scores = getAllHighScores()

    // Return the array of scores sorted by time
    return scores[key] ? [...scores[key]].sort((a, b) => a.time - b.time) : []
  }

  // Get the player's name
  const getPlayerName = (): string | undefined => {
    return config.get('playerName') as string
  }

  // Set the player's name
  const setPlayerName = (name: string): void => {
    config.set('playerName', name)
  }

  const value: HighScoreContextValue = {
    getHighScore,
    saveHighScore,
    isNewHighScore,

    // TODO: This really doesn't make sense here but it's where we have our persistent data store...
    onlineEnabled,
    setOnlineEnabled: (enabled: boolean): void => {
      // Update the config value and the local state
      config.set('onlineEnabled', enabled)
      setOnlineEnabled(enabled)
    },

    getAllHighScores,
    getLocalLeaderboard,
    getPlayerName,
    setPlayerName,
    getDeviceId,
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
