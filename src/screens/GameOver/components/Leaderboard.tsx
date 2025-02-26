import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from '../../../constants/colors.js'
import { useHighScores } from '../../../context/HighScoreContext/index.js'
import { GameMode, GridDimension } from '../../../types/game.js'
import { formatTime } from '../../../utils/time.js'

interface LeaderboardProps {
  gameMode: GameMode
  gridDimension: GridDimension
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  gameMode,
  gridDimension,
}) => {
  const { getLocalLeaderboard } = useHighScores()
  const scores = getLocalLeaderboard(gameMode, gridDimension)

  if (scores.length === 0) {
    return null
  }

  return (
    <Box flexDirection="column" marginY={1} width={50}>
      <Text color={COLORS.gold} bold>
        🏆 Leaderboard ({gridDimension.rows}x{gridDimension.cols} - {gameMode})
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

        {scores.map((score, index) => {
          const date = new Date(score.date)
          const formattedDate = `${date.toLocaleDateString()}`

          return (
            <Box key={index}>
              <Box width={20}>
                <Text color={COLORS.p1}>{score.playerName || 'Anonymous'}</Text>
              </Box>
              <Box width={15}>
                <Text>{formatTime(score.time)}</Text>
              </Box>
              <Box width={15}>
                <Text color={COLORS.dim}>{formattedDate}</Text>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
