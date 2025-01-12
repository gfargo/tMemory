import { Box, Text, useInput } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import React from 'react'
import { GameLayout } from "../../components/layout/GameLayout.js"
import { COLORS } from "../../constants/colors.js"
import { useGame } from '../../context/GameContext/index.js'
import { Controls } from "./components/Controls.js"
import { ALL_PRESET_GRIDS, isValidGrid } from "../../constants/gridPresets.js"
import { GameModeSelect } from "./components/GameModeSelect.js"
import { GridSizeConfig } from "./components/GridSizeConfig.js"
import { HighScoreDisplay } from "./components/HighScoreDisplay.js"

export const MainMenu: React.FC = () => {
  const { state, dispatch } = useGame()

  useInput((input, key) => {
    if (input === 'm' || input === 'M') {
      dispatch({
        type: 'SET_GRID_SELECTION_MODE',
        payload: state.gridSelectionMode === 'preset' ? 'custom' : 'preset'
      })
      return
    }

    if (input === 'g' || input === 'G') {
      const nextMode = (() => {
        switch (state.gameMode) {
          case 'single': return 'vs-player'
          case 'vs-player': return 'vs-ai'
          case 'vs-ai': return 'single'
        }
      })()
      dispatch({ type: 'SET_GAME_MODE', payload: nextMode })
      return
    }

    if (state.gridSelectionMode === 'preset') {
      if (key.upArrow && state.currentPresetIndex < ALL_PRESET_GRIDS.length - 1) {
        const nextIndex = state.currentPresetIndex + 1
        const nextGrid = ALL_PRESET_GRIDS[nextIndex]
        if (nextGrid) {
          dispatch({ type: 'SET_CURRENT_PRESET_INDEX', payload: nextIndex })
          dispatch({ type: 'SET_GRID_DIMENSION', payload: nextGrid })
        }
      } else if (key.downArrow && state.currentPresetIndex > 0) {
        const nextIndex = state.currentPresetIndex - 1
        const nextGrid = ALL_PRESET_GRIDS[nextIndex]
        if (nextGrid) {
          dispatch({ type: 'SET_CURRENT_PRESET_INDEX', payload: nextIndex })
          dispatch({ type: 'SET_GRID_DIMENSION', payload: nextGrid })
        }
      }
    } else {
      // Custom mode
      if (key.leftArrow) {
        const next = { ...state.gridDimension, cols: Math.max(state.gridDimension.cols - 1, 1) }
        if (isValidGrid(next)) {
          dispatch({ type: 'SET_GRID_DIMENSION', payload: next })
        }
      } else if (key.rightArrow) {
        const next = { ...state.gridDimension, cols: Math.min(state.gridDimension.cols + 1, 12) }
        if (isValidGrid(next)) {
          dispatch({ type: 'SET_GRID_DIMENSION', payload: next })
        }
      } else if (key.upArrow) {
        const next = { ...state.gridDimension, rows: Math.min(state.gridDimension.rows + 1, 12) }
        if (isValidGrid(next)) {
          dispatch({ type: 'SET_GRID_DIMENSION', payload: next })
        }
      } else if (key.downArrow) {
        const next = { ...state.gridDimension, rows: Math.max(state.gridDimension.rows - 1, 1) }
        if (isValidGrid(next)) {
          dispatch({ type: 'SET_GRID_DIMENSION', payload: next })
        }
      }
    }

    if (input === ' ' || key.return) {
      dispatch({ type: 'START_NEW_GAME' })
    }
  })
  const { gameMode, gridDimension, gridSelectionMode } = state

  return (
    <GameLayout>
      <Box height={6}>
        <Gradient name="cristal">
          <BigText text="Memory" />
        </Gradient>
      </Box>

      <GameModeSelect currentMode={gameMode} />
      <GridSizeConfig
        gridDimension={gridDimension}
        selectionMode={gridSelectionMode}
      />
      <HighScoreDisplay gameMode={gameMode} gridDimension={gridDimension} />
      <Controls gridSelectionMode={gridSelectionMode} />

      <Box marginTop={1}>
        <Text color={COLORS.dim}>
          Press <Text color={COLORS.p1} bold>Space</Text> to begin!
        </Text>
      </Box>
    </GameLayout>
  )
}