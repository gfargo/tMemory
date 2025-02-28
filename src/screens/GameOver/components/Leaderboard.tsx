import { Box, Text } from 'ink'
import React, { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../../../api/scoreApi.js'
import { COLORS } from '../../../constants/colors.js'
import { GameMode, GridDimension } from '../../../types/game.js'
import { formatTime } from '../../../utils/time.js'

interface Score {
  playerName: string
  deviceId: string
  time: number
  rows: number
  cols: number
  gameMode: string
  date: string
  verified?: boolean
}

interface LeaderboardProps {
  gameMode: GameMode
  gridDimension: GridDimension
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  gameMode,
  gridDimension,
}) => {
  const [scores, setScores] = useState<Score[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setScores([])

    fetchLeaderboard({
      gameMode,
      rows: gridDimension.rows,
      cols: gridDimension.cols,
    })
      .then((data) => {
        if (data.leaderboard) {
          setScores(data.leaderboard)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [gameMode, gridDimension])

  return (
    <Box flexDirection="column" marginY={1} width={50}>
      <Text color={COLORS.gold} bold>
        🏆 Leaderboard (Remote): {gridDimension.rows}x{gridDimension.cols} -{' '}
        {gameMode}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Box width={20}>
            <Text color={COLORS.info} bold>
              Player
            </Text>
          </Box>
          <Box width={15}>
            <Text color={COLORS.info} bold>
              Time
            </Text>
          </Box>
          <Box width={15}>
            <Text color={COLORS.info} bold>
              Date
            </Text>
          </Box>
        </Box>

        {isLoading && (
          <Box marginY={1}>
            <Text dimColor>Loading...</Text>
          </Box>
        )}

        {scores.length === 0 && !isLoading && (
          <Box marginY={1}>
            {error ? (
              <Text color="red">Error: {error}</Text>
            ) : (
              <Text color={COLORS.dim}>No remote scores available yet.</Text>
            )}
          </Box>
        )}

        {scores.length && scores.length > 0
          ? scores.map((score, index) => {
              const date = new Date(score.date)
              const formattedDate = date.toLocaleDateString()
              return (
                <Box key={index}>
                  <Box width={20}>
                    <Text color={COLORS.p1}>
                      {score.playerName || 'Anonymous'}
                    </Text>
                  </Box>
                  <Box width={15}>
                    <Text>{formatTime(score.time)}</Text>
                  </Box>
                  <Box width={15}>
                    <Text color={COLORS.dim}>{formattedDate}</Text>
                  </Box>
                </Box>
              )
            })
          : null}
      </Box>
    </Box>
  )
}
