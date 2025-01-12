import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"
import { GameMode, GameScores } from "../../../types/game.js"

interface ScoreDisplayProps {
  scores: GameScores
  gameMode: GameMode
  compact?: boolean
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  scores,
  gameMode,
  compact = false,
}) => {
  return (
    <Box>
      {!compact && <Text dimColor>Scores{` `}</Text>}
      <Text>
        P1{' '}
        <Text color={COLORS.p1} bold>
          {scores.p1}
        </Text>
      </Text>
      {(gameMode === 'vs-player' || gameMode === 'vs-ai') && (
        <Text>
          {' '}
          |{' '}
          <Text>
            {gameMode === 'vs-ai' ? 'AI' : 'P2'}{' '}
            <Text bold color={gameMode === 'vs-ai' ? COLORS.ai : COLORS.p2}>
              {gameMode === 'vs-ai' ? scores.ai : scores.p2}
            </Text>
          </Text>
        </Text>
      )}
    </Box>
  )
}