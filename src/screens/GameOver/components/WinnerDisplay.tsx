import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"
import { Winner } from "../../../types/game.js"

interface WinnerDisplayProps {
  winner: Winner
}

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner }) => {
  const color =
    winner === 'Player' || winner === 'P1'
      ? COLORS.p1
      : winner === 'P2'
      ? COLORS.p2
      : winner === 'AI'
      ? COLORS.ai
      : COLORS.warn

  const message =
    winner === 'Player'
      ? 'You Win!'
      : winner === 'P1'
      ? 'P1 Wins!'
      : winner === 'P2'
      ? 'P2 Wins!'
      : winner === 'AI'
      ? 'AI Wins!'
      : "It's a Tie!"

  return (
    <Box marginTop={1}>
      <Text bold color={color}>
        {message}
      </Text>
    </Box>
  )
}