import React, { createContext, useContext, useReducer } from 'react'
import { GameMode } from '../../types/game.js'
import { gameReducer, initialState } from "./reducer.js"
import { GameContextValue } from "./types.js"

const GameContext = createContext<GameContextValue | undefined>(undefined)

interface GameProviderProps {
  children: React.ReactNode
  initialMode?: GameMode
  initialGrid?: { rows: number; cols: number }
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  initialMode,
  initialGrid,
}) => {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    ...(initialMode && { gameMode: initialMode }),
    ...(initialGrid && { gridDimension: initialGrid }),
  })

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}