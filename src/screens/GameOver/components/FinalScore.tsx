import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from '../../../constants/colors.js'
import { GameMode, GameScores } from '../../../types/game.js'

interface FinalScoreProps {
  scores: GameScores
  gameMode: GameMode
}

export const FinalScore: React.FC<FinalScoreProps> = ({ scores, gameMode }) => {
  return (
    <Box marginY={1} flexDirection="column" alignItems="center">
      <Text dimColor>Final Score:</Text>
      <Box gap={2}>
        <Text color={COLORS.p1}>
          P1: <Text bold>{String(scores.p1)}</Text>
        </Text>
        {gameMode === 'vs-ai' ? (
          <Text color={COLORS.ai}>
            AI: <Text bold>{String(scores.ai)}</Text>
          </Text>
        ) : (
          gameMode === 'vs-player' && (
            <Text color={COLORS.p2}>
              P2: <Text bold>{String(scores.p2)}</Text>
            </Text>
          )
        )}
      </Box>
    </Box>
  )
}
