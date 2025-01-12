import { Box, Text, useInput } from 'ink'
import Gradient from 'ink-gradient'
import React, { useEffect } from 'react'
import { GameLayout } from '../../components/layout/GameLayout.js'
import { COLORS } from '../../constants/colors.js'
import { findAIMove } from '../../context/GameContext/actions.js'
import { useGame } from '../../context/GameContext/index.js'
import { GameControls } from './components/GameControls.js'
import { GameGrid } from './components/GameGrid.js'
import { GameStatus } from './components/GameStatus.js'

export const GameScreen: React.FC = () => {
  const { state, dispatch } = useGame()

  // Handle switching players after no match
  useEffect((): (() => void) | void => {
    if (state.flippedIndices.length === 2) {
      const [first, second] = state.flippedIndices
      // Ensure indices are valid
      if (typeof first !== 'number' || typeof second !== 'number') return
      const firstCard = state.grid[first]
      const secondCard = state.grid[second]
      const isMatch = firstCard && secondCard && firstCard.value === secondCard.value
      if (!isMatch) {
        // Wait a moment before switching players
        const timer = setTimeout(() => {
          dispatch({ type: 'SWITCH_PLAYER' })
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [state.flippedIndices])

  // Handle AI turns
  useEffect((): (() => void) | void => {
    if (state.currentPlayer === 'ai' && state.flippedIndices.length === 0) {
      // Add a small delay before AI moves
      const timer = setTimeout(() => {
        const [first, second] = findAIMove(state.grid, state.matchedIndices, state.flippedIndices)
        dispatch({ type: 'FLIP_CARD', payload: first })
        // Add delay between first and second card
        setTimeout(() => {
          dispatch({ type: 'FLIP_CARD', payload: second })
        }, 500)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.currentPlayer, state.flippedIndices.length])

  useInput((input, key) => {
    if (state.currentPlayer === 'ai') return

    if (key.leftArrow) {
      dispatch({ type: 'SET_SELECTED_INDEX', payload: Math.max(0, state.selectedIndex - 1) })
    } else if (key.rightArrow) {
      dispatch({ type: 'SET_SELECTED_INDEX', payload: Math.min(state.grid.length - 1, state.selectedIndex + 1) })
    } else if (key.upArrow) {
      dispatch({ type: 'SET_SELECTED_INDEX', payload: Math.max(0, state.selectedIndex - state.gridDimension.cols) })
    } else if (key.downArrow) {
      dispatch({ type: 'SET_SELECTED_INDEX', payload: Math.min(state.grid.length - 1, state.selectedIndex + state.gridDimension.cols) })
    } else if (input === ' ' || input === 'enter') {
      // console.log('Flipping card at index:', state.selectedIndex)
      dispatch({ type: 'FLIP_CARD', payload: state.selectedIndex })
    }
  })

  return (
    <GameLayout>
      <Box flexDirection="column" borderStyle="singleDouble" paddingX={1} width={'100%'}>
        {/* Header */}
        <Box justifyContent="space-between">
          <Gradient name="cristal">
            <Text>tMemory</Text>
          </Gradient>
          <Text color={COLORS.info}>
            [{state.gameMode === 'single' ? 'Single Player' : state.gameMode === 'vs-player' ? 'P1 vs P2' : 'vs AI'}]
          </Text>
        </Box>

        <GameStatus />
        <GameGrid />
        <GameControls />
      </Box>
    </GameLayout>
  )
}
