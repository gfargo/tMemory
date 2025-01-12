import { Box, Text } from 'ink'
import Gradient from 'ink-gradient'
import React from 'react'
import { GridPreview } from '../../../components/common/GridPreview/index.js'
import { COLORS } from '../../../constants/colors.js'
import { GridDimension } from '../../../types/game.js'

interface GridSizeConfigProps {
  gridDimension: GridDimension
  selectionMode: 'preset' | 'custom'
}

export const GridSizeConfig: React.FC<GridSizeConfigProps> = ({
  gridDimension,
  selectionMode,
}) => {
  return (
    <Box marginY={1} flexDirection="column" alignItems="center">
      <Box>
        <Gradient name="cristal">
          <Text>
            Grid Size [{selectionMode}]:{' '}
            <Text bold>
              {gridDimension.rows}x{gridDimension.cols}
            </Text>{' '}
            ({Math.floor((gridDimension.rows * gridDimension.cols) / 2)} pairs)
          </Text>
        </Gradient>
      </Box>

      {selectionMode === 'custom' && (
        <Box flexDirection="column" alignItems="center" marginTop={1}>
          <Box>
            <Text>
              Rows:{' '}
              <Text bold color={COLORS.p1}>
                {gridDimension.rows}
              </Text>
              <Text> | </Text>
              Cols:{' '}
              <Text bold color={COLORS.p1}>
                {gridDimension.cols}
              </Text>
            </Text>
          </Box>

          <GridPreview dimension={gridDimension} />
        </Box>
      )}
    </Box>
  )
}
