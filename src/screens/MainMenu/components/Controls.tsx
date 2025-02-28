import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from '../../../constants/colors.js'

interface ControlsProps {
  gridSelectionMode: 'preset' | 'custom'
  onlineEnabled: boolean
}

export const Controls: React.FC<ControlsProps> = ({
  gridSelectionMode,
  onlineEnabled,
}) => {
  return (
    <Box flexDirection="column" marginY={1} minWidth={40}>
      <Text bold color={COLORS.warn}>
        Controls:
      </Text>
      <Text>
        <Text bold>G</Text> <Text dimColor>Change game mode</Text>
      </Text>
      <Text>
        <Text bold>L</Text> <Text dimColor>View leaderboard</Text>
      </Text>
      <Text>
        <Text bold>O</Text>{' '}
        <Text dimColor>
          Toggle online leaderboard (
          {onlineEnabled ? (
            <Text color={COLORS.info}>Enabled</Text>
          ) : (
            <Text color={COLORS.warn}>Disabled</Text>
          )}
          )
        </Text>
      </Text>
      <Text>
        <Text bold>M</Text>{' '}
        <Text dimColor>
          Switch {gridSelectionMode === 'preset' ? 'to custom' : 'to preset'}{' '}
          mode
        </Text>
      </Text>
      {gridSelectionMode === 'preset' ? (
        <Text>
          <Text bold>↑/↓</Text> <Text dimColor>Cycle through grid sizes</Text>
        </Text>
      ) : (
        <>
          <Text>
            <Text bold>←/→</Text> <Text dimColor>Adjust columns</Text>
          </Text>
          <Text>
            <Text bold>↑/↓</Text> <Text dimColor>Adjust rows</Text>
          </Text>
        </>
      )}
    </Box>
  )
}
