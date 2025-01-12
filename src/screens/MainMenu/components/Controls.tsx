import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"

interface ControlsProps {
  gridSelectionMode: 'preset' | 'custom'
}

export const Controls: React.FC<ControlsProps> = ({ gridSelectionMode }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text bold color={COLORS.warn}>
        Controls:
      </Text>
      <Text>
        <Text bold>G</Text> <Text dimColor>Change game mode</Text>
      </Text>
      <Text>
        <Text bold>M</Text>{' '}
        <Text dimColor>
          Switch {gridSelectionMode === 'preset' ? 'to custom' : 'to preset'} mode
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