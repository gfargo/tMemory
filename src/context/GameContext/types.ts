import { GameCard, GameMode, GameScores, GameState, GridDimension, Player, Winner } from "../../types/game.js"

export interface GameContextState {
  gameState: GameState
  gameMode: GameMode
  gridDimension: GridDimension
  gridSelectionMode: 'preset' | 'custom'
  currentPresetIndex: number
  grid: GameCard[]
  flippedIndices: number[]
  matchedIndices: number[]
  currentPlayer: Player
  scores: GameScores
  selectedIndex: number
  message: string
  startTime: number
  endTime: number
  winner: Winner
  shouldTrackScore: boolean
  isNewRecord: boolean
}

export type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_GAME_MODE'; payload: GameMode }
  | { type: 'SET_GRID_DIMENSION'; payload: GridDimension }
  | { type: 'SET_GRID_SELECTION_MODE'; payload: 'preset' | 'custom' }
  | { type: 'SET_CURRENT_PRESET_INDEX'; payload: number }
  | { type: 'SET_GRID'; payload: GameCard[] }
  | { type: 'SET_FLIPPED_INDICES'; payload: number[] }
  | { type: 'SET_MATCHED_INDICES'; payload: number[] }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player }
  | { type: 'SET_SCORES'; payload: GameScores }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_START_TIME'; payload: number }
  | { type: 'SET_END_TIME'; payload: number }
  | { type: 'START_NEW_GAME' }
  | { type: 'FLIP_CARD'; payload: number }
  | { type: 'SWITCH_PLAYER' }
  | { type: 'SET_WINNER'; payload: Winner }
  | { type: 'SET_SHOULD_TRACK_SCORE'; payload: boolean }
  | { type: 'SET_IS_NEW_RECORD'; payload: boolean }

export interface GameContextValue {
  state: GameContextState
  dispatch: React.Dispatch<GameAction>
}