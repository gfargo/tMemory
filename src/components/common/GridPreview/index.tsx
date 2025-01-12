import { Box, Text } from 'ink'
import React from 'react'
import { COLORS } from "../../../constants/colors.js"
import { GridDimension } from "../../../types/game.js"
import { renderGridPreview } from "../../../utils/grid.js"

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
        <Text key={i} color={line.includes('?') ? COLORS.info : COLORS.dim}>
          {line}
        </Text>
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