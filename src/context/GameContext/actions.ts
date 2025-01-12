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
  matchedIndices: number[],
  flippedIndices: number[] = []
): [number, number] => {
  // Get all unmatched cards
  const unmatched = grid
    .map((card, index) => ({ card, index }))
    .filter(({ index }) => !matchedIndices.includes(index))

  if (unmatched.length < 2) return [0, 1]

  // Get cards that have been seen (previously flipped)
  const seenCards = new Map<string, number>()
  grid.forEach((card, index) => {
    if (card.faceUp || flippedIndices.includes(index)) {
      seenCards.set(card.value, index)
    }
  })

  // Check for a matching pair among seen cards
  for (const [value, index] of seenCards.entries()) {
    const matchingCard = unmatched.find(
      ({ card, index: idx }) => 
        idx !== index && 
        !matchedIndices.includes(idx) && 
        !flippedIndices.includes(idx) && 
        card.value === value
    )

    if (matchingCard) {
      return [index, matchingCard.index]
    }
  }

  // If no known pairs, try to flip a card we haven't seen yet
  const unseenCards = unmatched.filter(
    ({ card }) => !seenCards.has(card.value)
  )

  if (unseenCards.length > 0) {
    // Pick one unseen card
    const randomUnseenIndex = Math.floor(Math.random() * unseenCards.length)
    const randomUnseen = unseenCards[randomUnseenIndex]
    if (!randomUnseen) {
      // Fallback to random selection if something went wrong
      return [unmatched[0]?.index ?? 0, unmatched[1]?.index ?? 1]
    }
    
    // And one random card from remaining unmatched cards
    const otherCards = unmatched.filter(({ index }) => index !== randomUnseen.index)
    if (otherCards.length === 0) {
      // Fallback if no other cards available
      return [randomUnseen.index, unmatched[0]?.index ?? 0]
    }
    
    const randomOtherIndex = Math.floor(Math.random() * otherCards.length)
    const randomOther = otherCards[randomOtherIndex]
    if (!randomOther) {
      // Fallback if random selection failed
      return [randomUnseen.index, otherCards[0]?.index ?? 0]
    }
    
    return [randomUnseen.index, randomOther.index]
  }

  // Fallback to random selection if all cards have been seen
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