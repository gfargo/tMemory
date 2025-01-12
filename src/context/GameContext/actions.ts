import { createStandardDeck } from 'ink-playing-cards'
import { GameCard, GameContextState, GameMode, GridDimension, Player } from "../../types/game.js"
import { isValidGrid } from "../../constants/gridPresets.js"

export const createPairedDeck = () => {
  // Create multiple standard decks to ensure we have enough cards
  const standardDeck = [
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
  ]

  // Group cards by their value
  const groupedByValue = standardDeck.reduce<Map<string, GameCard[]>>(
    (acc, card) => {
      if ('value' in card && 'suit' in card) {
        const value = card.value
        const cards = acc.get(value) || []
        cards.push({
          value,
          suit: card.suit,
          faceUp: false,
          selected: false,
        })
        acc.set(value, cards)
      }
      return acc
    },
    new Map()
  )

  // Create array of pairs
  const pairs: [GameCard, GameCard][] = []
  groupedByValue.forEach((cards) => {
    while (cards.length >= 2) {
      const card1 = cards.pop()!
      const card2 = cards.pop()!
      pairs.push([
        { ...card1, faceUp: false },
        { ...card2, faceUp: false },
      ])
    }
  })

  // Randomize and flatten
  return pairs.sort(() => Math.random() - 0.5).flat()
}

export const cycleGameMode = (current: GameMode): GameMode => {
  switch (current) {
    case 'single':
      return 'vs-player'
    case 'vs-player':
      return 'vs-ai'
    case 'vs-ai':
      return 'single'
  }
}

export const getNextPlayer = (
  currentPlayer: Player,
  gameMode: GameMode
): Player => {
  switch (gameMode) {
    case 'single':
      return 'p1'
    case 'vs-player':
      return currentPlayer === 'p1' ? 'p2' : 'p1'
    case 'vs-ai':
      return currentPlayer === 'p1' ? 'ai' : 'p1'
  }
}

export const findAIMove = (
  grid: GameCard[],
  matchedIndices: number[]
): [number, number] => {
  const unmatched = grid
    .map((card, index) => ({ card, index }))
    .filter(({ index }) => !matchedIndices.includes(index))

  if (unmatched.length < 2) return [0, 1]

  // Check if AI remembers a pair
  const knownPair = unmatched.find(({ card, index: idx }) =>
    unmatched.some(
      (other) => other.index !== idx && other.card.value === card.value
    )
  )

  if (knownPair) {
    const secondCard = unmatched.find(
      ({ card, index }) =>
        index !== knownPair.index && card.value === knownPair.card.value
    )
    if (secondCard) {
      return [knownPair.index, secondCard.index]
    }
  }

  // Random selection
  const shuffledIndices = unmatched
    .map(({ index }) => index)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  return [shuffledIndices[0] ?? 0, shuffledIndices[1] ?? 1]
}

export const adjustGridDimension = (
  current: GridDimension,
  direction: 'up' | 'down' | 'left' | 'right'
): GridDimension => {
  const next = { ...current }

  switch (direction) {
    case 'up':
      next.rows = Math.min(next.rows + 1, 12)
      break
    case 'down':
      next.rows = Math.max(next.rows - 1, 1)
      break
    case 'left':
      next.cols = Math.max(next.cols - 1, 1)
      break
    case 'right':
      next.cols = Math.min(next.cols + 1, 12)
      break
  }

  return isValidGrid(next) ? next : current
}

export const determineWinner = (
  state: GameContextState
): 'Player' | 'P1' | 'P2' | 'AI' | 'Nobody' => {
  const { gameMode, scores } = state

  if (gameMode === 'vs-ai') {
    return scores.p1 > scores.ai ? 'Player' : scores.ai > scores.p1 ? 'AI' : 'Nobody'
  } else if (gameMode === 'vs-player') {
    return scores.p1 > scores.p2 ? 'P1' : scores.p2 > scores.p1 ? 'P2' : 'Nobody'
  } else {
    return 'Player'
  }
}