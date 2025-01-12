import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from '../../../constants/colors.js'
import { useHighScores } from '../../../context/HighScoreContext/index.js'
import { GameMode, GridDimension } from '../../../types/game.js'
import { formatTime } from '../../../utils/time.js'

interface HighScoreDisplayProps {
  gameMode: GameMode
  gridDimension: GridDimension
}

export const HighScoreDisplay: React.FC<HighScoreDisplayProps> = ({
  gameMode,
  gridDimension,
}) => {
  const { getHighScore } = useHighScores()
  const currentHighScore = getHighScore(gameMode, gridDimension)

  return (
    <Box marginY={1} flexDirection="column" alignItems="center" minWidth={48}>
      {currentHighScore ? (
        <Box alignItems="center" minWidth={48} justifyContent="center">
          <Text color={COLORS.gold} bold>
            Best Time:
          </Text>
          <Text color={COLORS.gold}>{formatTime(currentHighScore.time)}</Text>
        </Box>
      ) : (
        <Text color={COLORS.dim} dimColor>
          No records yet!
        </Text>
      )}
    </Box>
  )
}
