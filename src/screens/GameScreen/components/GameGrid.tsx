import { Box } from 'ink'
import React from 'react'
import { CardWrapper } from "../../../components/common/Card/index.js"
import { useGame } from "../../../context/GameContext/index.js"

export const GameGrid: React.FC = () => {
  const { state } = useGame()
  const {
    grid,
    gridDimension,
    flippedIndices,
    matchedIndices,
    selectedIndex,
  } = state

  return (
    <Box flexDirection="column" alignItems="center" flexGrow={1}>
      {Array.from({ length: gridDimension.rows }, (_, row) => (
        <Box key={row} gap={1}>
          {Array.from({ length: gridDimension.cols }, (_, col) => {
            const index = row * gridDimension.cols + col
            const card = grid[index]
            return (
              <Box key={col}>
                {card && (
                  <CardWrapper
                    card={card}
                    gridDimension={gridDimension}
                    faceUp={
                      flippedIndices.includes(index) ||
                      matchedIndices.includes(index)
                    }
                    selected={selectedIndex === index}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}