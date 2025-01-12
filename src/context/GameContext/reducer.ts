import { GameAction, GameContextState } from "./types.js"
import { createPairedDeck, determineWinner } from "./actions.js"

export const initialState: GameContextState = {
  gameState: 'welcome',
  gameMode: 'single',
  gridDimension: { rows: 4, cols: 4 },
  gridSelectionMode: 'preset',
  currentPresetIndex: 1,
  grid: [],
  flippedIndices: [],
  matchedIndices: [],
  currentPlayer: 'p1',
  scores: { p1: 0, p2: 0, ai: 0 },
  selectedIndex: 0,
  message: '',
  startTime: 0,
  endTime: 0,
  winner: 'Nobody',
  shouldTrackScore: false,
  isNewRecord: false,
}

export const gameReducer = (
  state: GameContextState,
  action: GameAction
): GameContextState => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload }
    case 'SET_GRID_DIMENSION':
      return { ...state, gridDimension: action.payload }
    case 'SET_GRID_SELECTION_MODE':
      return { ...state, gridSelectionMode: action.payload }
    case 'SET_CURRENT_PRESET_INDEX':
      return { ...state, currentPresetIndex: action.payload }
    case 'SET_GRID':
      return { ...state, grid: action.payload }
    case 'SET_FLIPPED_INDICES':
      return { ...state, flippedIndices: action.payload }
    case 'SET_MATCHED_INDICES':
      return { ...state, matchedIndices: action.payload }
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload }
    case 'SET_SCORES':
      return { ...state, scores: action.payload }
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.payload }
    case 'SET_MESSAGE':
      return { ...state, message: action.payload }
    case 'SET_START_TIME':
      return { ...state, startTime: action.payload }
    case 'SET_END_TIME':
      return { ...state, endTime: action.payload }
    case 'SET_WINNER':
      return { ...state, winner: action.payload }
    case 'SET_SHOULD_TRACK_SCORE':
      return { ...state, shouldTrackScore: action.payload }
    case 'SET_IS_NEW_RECORD':
      return { ...state, isNewRecord: action.payload }
    case 'FLIP_CARD': {
      const index = action.payload
      const card = state.grid[index]

      // Don't flip if:
      // - Already have 2 cards flipped
      // - Card is already flipped
      // - Card doesn't exist
      // - Card is already matched
      if (
        state.flippedIndices.length === 2 ||
        state.flippedIndices.includes(index) ||
        !card ||
        state.matchedIndices.includes(index)
      ) {
        return state
      }

      const newFlippedIndices = [...state.flippedIndices, index]

      // Check for match when second card is flipped
      if (newFlippedIndices.length === 2) {
        const [firstIndex, secondIndex] = newFlippedIndices
        // Ensure indices are valid numbers
        if (typeof firstIndex !== 'number' || typeof secondIndex !== 'number') return state
        const firstCard = state.grid[firstIndex]
        const secondCard = state.grid[secondIndex]

        if (firstCard && secondCard && firstCard.value === secondCard.value) {
          // Match found!
          // Ensure indices are numbers before adding to matchedIndices
          const newMatchedIndices: number[] = [...state.matchedIndices, firstIndex, secondIndex]
          const newScores = { ...state.scores }
          newScores[state.currentPlayer] = newScores[state.currentPlayer] + 1

          // Check for game over
          const isGameOver = newMatchedIndices.length === state.grid.length
          if (isGameOver) {
            const winner = determineWinner(state)
            return {
              ...state,
              matchedIndices: newMatchedIndices,
              flippedIndices: [],
              scores: newScores,
              gameState: 'gameover',
              endTime: Date.now(),
              winner,
              message: `${winner === 'Nobody' ? "It's a Tie!" : `${winner} Wins!`}`,
            }
          }

          return {
            ...state,
            matchedIndices: newMatchedIndices,
            flippedIndices: [],
            scores: newScores,
            message: `${state.currentPlayer === 'ai' ? 'AI' : state.currentPlayer.toUpperCase()} found a match!`,
          }
        }

        // No match - will flip back after delay
        return {
          ...state,
          flippedIndices: newFlippedIndices,
          message: 'No match. Flipping cards back...',
        }
      }

      // First card flipped
      return {
        ...state,
        flippedIndices: newFlippedIndices,
        message: 'Select another card...',
      }
    }

    case 'SWITCH_PLAYER': {
      const nextPlayer = (() => {
        switch (state.gameMode) {
          case 'vs-ai':
            return state.currentPlayer === 'p1' ? 'ai' : 'p1'
          case 'vs-player':
            return state.currentPlayer === 'p1' ? 'p2' : 'p1'
          default:
            return 'p1'
        }
      })()

      return {
        ...state,
        currentPlayer: nextPlayer,
        flippedIndices: [],
        message: `${nextPlayer === 'ai' ? 'AI' : nextPlayer.toUpperCase()}'s turn`,
      }
    }

    case 'START_NEW_GAME': {
      // Calculate number of pairs based on grid dimensions
      const numPairs = Math.floor((state.gridDimension.rows * state.gridDimension.cols) / 2)
      const cards = createPairedDeck()
        .slice(0, numPairs * 2)
        .sort(() => Math.random() - 0.5)
      
      return {
        ...state,
        grid: cards,
        flippedIndices: [],
        matchedIndices: [],
        scores: { p1: 0, p2: 0, ai: 0 },
        currentPlayer: 'p1',
        message: 'Use arrow keys to move, space to flip a card.',
        gameState: 'playing',
        startTime: Date.now(),
        endTime: 0,
        winner: 'Nobody',
        shouldTrackScore: false,
        isNewRecord: false,
      }
    }
    default:
      return state
  }
}