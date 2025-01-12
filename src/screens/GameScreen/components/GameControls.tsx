import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"
import { useGame } from "../../../context/GameContext/index.js"

export const GameControls: React.FC = () => {
  const { state } = useGame()
  const { gameMode, currentPlayer } = state

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box justifyContent="space-between" marginBottom={1}>
        {gameMode !== 'single' && (
          <Text color={COLORS.info}>
            Current Player:{' '}
            <Text
              bold
              color={
                currentPlayer === 'ai'
                  ? COLORS.ai
                  : currentPlayer === 'p1'
                  ? COLORS.p1
                  : COLORS.p2
              }
            >
              {currentPlayer === 'ai' ? 'AI' : currentPlayer.toUpperCase()}
            </Text>
          </Text>
        )}
      </Box>
      {(currentPlayer === 'p1' || currentPlayer === 'p2') && (
        <Box flexDirection="column">
          <Text bold color={COLORS.warn}>
            Controls:
          </Text>
          <Text>
            ←/→/↑/↓ <Text dimColor>Move</Text>
          </Text>
          <Text>
            Space <Text dimColor>Flip card</Text>
          </Text>
        </Box>
      )}
    </Box>
  )
}