import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"
import { GameMode } from "../../../types/game.js"

interface GameModeSelectProps {
  currentMode: GameMode
}

export const GameModeSelect: React.FC<GameModeSelectProps> = ({ currentMode }) => {
  return (
    <Box marginY={1} marginTop={2}>
      <Text>Game Mode: </Text>
      <Text color={currentMode === 'single' ? COLORS.p1 : COLORS.dim} bold>
        Single Player
      </Text>
      <Text> / </Text>
      <Text color={currentMode === 'vs-player' ? COLORS.p2 : COLORS.dim} bold>
        P1 vs P2
      </Text>
      <Text> / </Text>
      <Text color={currentMode === 'vs-ai' ? COLORS.ai : COLORS.dim} bold>
        vs AI
      </Text>
    </Box>
  )
}