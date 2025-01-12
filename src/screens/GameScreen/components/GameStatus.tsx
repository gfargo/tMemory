import { Box, Text } from 'ink'
import React from 'react'
import { LiveTimer } from "../../../components/common/LiveTimer/index.js"
import { ScoreDisplay } from "../../../components/common/ScoreDisplay/index.js"
import { COLORS } from "../../../constants/colors.js"
import { useGame } from "../../../context/GameContext/index.js"

export const GameStatus: React.FC = () => {
  const { state } = useGame()
  const { startTime, scores, gameMode, message } = state

  return (
    <>
      <Box justifyContent="space-between" marginBottom={1}>
        <LiveTimer startTime={startTime} />
        <ScoreDisplay scores={scores} gameMode={gameMode} />
      </Box>

      {message && (
        <Box marginBottom={1} justifyContent="center">
          <Text color={COLORS.warn}>{message}</Text>
        </Box>
      )}
    </>
  )
}