import { Box, Text, useInput } from 'ink'
import Link from 'ink-link'
import React, { useState } from 'react'
import { COLORS } from '../../constants/colors.js'
import { ALL_PRESET_GRIDS } from '../../constants/gridPresets.js'
import { useGame } from '../../context/GameContext/index.js'
import { GameMode, GridDimension } from '../../types/game.js'
import { Leaderboard as LeaderboardComponent } from '../GameOver/components/Leaderboard.js'

// Define available game modes
const gameModes = ['single', 'vs-player', 'vs-ai']

export const LeaderboardScreen: React.FC = () => {
  const [currentModeIndex, setCurrentModeIndex] = useState(0)
  const currentMode = gameModes[currentModeIndex] as GameMode

  const [currentGridIndex, setCurrentGridIndex] = useState(0)
  const currentGrid = ALL_PRESET_GRIDS[currentGridIndex] as GridDimension

  const { dispatch } = useGame()

  useInput((input, key) => {
    if (key.leftArrow) {
      setCurrentModeIndex((prev) =>
        prev === 0 ? gameModes.length - 1 : prev - 1
      )
    } else if (key.rightArrow) {
      setCurrentModeIndex((prev) =>
        prev === gameModes.length - 1 ? 0 : prev + 1
      )
    } else if (key.upArrow) {
      setCurrentGridIndex((prev) =>
        prev === 0 ? ALL_PRESET_GRIDS.length - 1 : prev - 1
      )
    } else if (key.downArrow) {
      setCurrentGridIndex((prev) =>
        prev === ALL_PRESET_GRIDS.length - 1 ? 0 : prev + 1
      )
    } else if (input.toLowerCase() === 'b') {
      dispatch({ type: 'SET_GAME_STATE', payload: 'welcome' })
    }
  })

  return (
    <Box flexDirection="column" alignItems="center" padding={1}>
      <LeaderboardComponent
        gameMode={currentMode}
        gridDimension={currentGrid}
      />
      <Box marginTop={1}>
        <Text color={COLORS.dim}>
          Use <Text color={'white'}>⇵</Text> to change grid size. Use{' '}
          <Text color={'white'}>⇆</Text> to switch game modes. Press{' '}
          <Text color={'white'}>'b'</Text> to go back to Main Menu.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={COLORS.dim}>
          <Link url="https://tmemory.griffen.codes/#leaderboard">
            View the{` `}
            <Text color="cyan">full leaderboard</Text>
          </Link>
        </Text>
      </Box>
    </Box>
  )
}

export default LeaderboardScreen
