import { Box, Text } from 'ink'
import Gradient from 'ink-gradient'
import React from 'react'
import { GridDimension } from '../../../types/game.js'
import { renderGridPreview } from '../../../utils/grid.js'

interface GridPreviewProps {
  dimension: GridDimension
  showStats?: boolean
}

export const GridPreview: React.FC<GridPreviewProps> = ({
  dimension,
  showStats = true,
}) => {
  return (
    <Box flexDirection="column" alignItems="center">
      {renderGridPreview(dimension).map((line, i) => (
        <Gradient key={i} name="mind">
          <Text>{line}</Text>
        </Gradient>
      ))}
      {showStats && (
        <Text dimColor>
          Total: {dimension.rows * dimension.cols} cards (
          {Math.floor((dimension.rows * dimension.cols) / 2)} pairs)
        </Text>
      )}
    </Box>
  )
}
