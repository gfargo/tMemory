import { Box, Text, useApp, useInput } from 'ink'
import type { CardProps, TCardValue, TSuit } from 'ink-playing-cards'
import {
  Card,
  createStandardDeck,
  DeckProvider,
  MiniCard,
  useDeck,
} from 'ink-playing-cards'
import React, { useEffect, useState } from 'react'

type GameState = 'welcome' | 'playing' | 'gameover'

interface GameCard {
  suit: TSuit
  value: TCardValue
  faceUp: boolean
  selected?: boolean
}

const Game: React.FC = () => {
  const { exit } = useApp()
  const { hand, deck } = useDeck()
  const [grid, setGrid] = useState<GameCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedIndices, setMatchedIndices] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const [message, setMessage] = useState('')
  const [gameMode, setGameMode] = useState<'single' | 'vs-ai'>('single')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [gameState, setGameState] = useState<GameState>('welcome')
  const [gridSize, setGridSize] = useState<2 | 4 | 6 | 8 | 10 | 12>(4)
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)

  const startNewGame = () => {
    // Calculate number of pairs based on grid size
    const numPairs = Math.floor((gridSize * gridSize) / 2)
    const cards = []

    for (let i = 0; i < numPairs * 2; i++) {
      const card = deck.drawCard() as GameCard
      cards.push(card)
    }

    // Shuffle the drawn cards to randomize pair positions
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5)

    setGrid(shuffledCards)
    setFlippedIndices([])
    setMatchedIndices([])
    setScores({ player: 0, ai: 0 })
    setCurrentPlayer('player')
    setMessage('Use arrow keys to move, space to flip a card.')
    setGameState('playing')
    setStartTime(Date.now())
    setEndTime(0)
  }

  const flipCard = (index: number) => {
    const card = grid[index]
    if (
      flippedIndices.length === 2 ||
      flippedIndices.includes(index) ||
      !card ||
      matchedIndices.includes(index)
    ) {
      return
    }

    const newFlippedIndices = [...flippedIndices, index]
    setFlippedIndices(newFlippedIndices)

    if (newFlippedIndices.length === 2) {
      const [firstIndex, secondIndex] = newFlippedIndices as [number, number]
      const firstCard = grid[firstIndex]
      const secondCard = grid[secondIndex]

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        const newMatchedIndices = [...matchedIndices, firstIndex, secondIndex]
        setMatchedIndices(newMatchedIndices)
        setScores((prevScores) => ({
          ...prevScores,
          [currentPlayer]: prevScores[currentPlayer] + 1,
        }))
        setMessage(
          `${currentPlayer === 'player' ? 'You' : 'AI'} found a match!`
        )
        setFlippedIndices([])

        // Check if game is over
        if (newMatchedIndices.length === grid.length) {
          setEndTime(Date.now())
          setGameState('gameover')
        }
      } else {
        setMessage('No match. Flipping cards back.')
        setTimeout(() => {
          setFlippedIndices([])
          switchPlayer()
        }, 1000)
      }
    }
  }

  const switchPlayer = () => {
    if (gameMode === 'vs-ai') {
      setCurrentPlayer(currentPlayer === 'player' ? 'ai' : 'player')
      if (currentPlayer === 'player') {
        setTimeout(playAI, 1000)
      }
    }
  }

  const playAI = () => {
    const unmatched = grid
      .map((card, index) => ({ card, index }))
      .filter(({ index }) => !matchedIndices.includes(index))

    if (unmatched.length < 2) return

    let firstIndex = 0
    let secondIndex = 1

    // Check if AI remembers a pair
    const knownPair = unmatched.find(({ card, index: idx }) =>
      unmatched.some(
        (other) => other.index !== idx && other.card.value === card.value
      )
    )

    if (knownPair) {
      firstIndex = knownPair.index
      const secondCard = unmatched.find(
        ({ card, index: idx }) =>
          idx !== firstIndex && card.value === knownPair.card.value
      )
      if (secondCard) {
        secondIndex = secondCard.index
      }
    } else {
      // Randomly select two cards
      const shuffledIndices = unmatched
        .map(({ index }) => index)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
      firstIndex = shuffledIndices[0] ?? 0
      secondIndex = shuffledIndices[1] ?? 1
    }

    flipCard(firstIndex)
    setTimeout(() => flipCard(secondIndex), 1000)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  useInput((input, key) => {
    if (gameState === 'welcome') {
      if (key.leftArrow || key.rightArrow) {
        setGameMode((prev) => (prev === 'single' ? 'vs-ai' : 'single'))
      } else if (key.upArrow && gridSize > 2) {
        setGridSize((prev) => (prev - 2) as 2 | 4 | 6 | 8 | 10 | 12)
      } else if (key.downArrow && gridSize < 12) {
        setGridSize((prev) => (prev + 2) as 2 | 4 | 6 | 8 | 10 | 12)
      } else if (input === ' ' || input === 'enter') {
        setGameState('playing')
      }
      return
    }

    if (gameState === 'gameover') {
      if (input === 'n') {
        setGameState('welcome')
      } else if (input === 'q') {
        exit()
      }
      return
    }

    if (currentPlayer !== 'player') return

    if (key.leftArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
    } else if (key.rightArrow) {
      setSelectedIndex(Math.min(grid.length - 1, selectedIndex + 1))
    } else if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - gridSize))
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(grid.length - 1, selectedIndex + gridSize))
    } else if (input === ' ') {
      flipCard(selectedIndex)
    }
  })

  useEffect(() => {
    if (gameState === 'playing' && hand.cards.length === 0) {
      startNewGame()
    }
  }, [gameState])

  if (gameState === 'welcome') {
    return (
      <Box flexDirection="column" alignItems="center" padding={1}>
        <Text bold>Welcome to Memory/Concentration Game!</Text>
        <Box marginY={1}>
          <Text>Game Mode: </Text>
          <Text color={gameMode === 'single' ? 'green' : 'white'}>
            Single Player
          </Text>
          <Text> / </Text>
          <Text color={gameMode === 'vs-ai' ? 'green' : 'white'}>vs AI</Text>
        </Box>
        <Box marginY={1}>
          <Text>
            Grid Size: {gridSize}x{gridSize} (
            {Math.floor((gridSize * gridSize) / 2)} pairs)
          </Text>
        </Box>
        <Box flexDirection="column" marginY={1}>
          <Text>Controls:</Text>
          <Text>- Left/Right arrows to change game mode</Text>
          <Text>- Up/Down arrows to adjust grid size</Text>
          <Text>- Space or Enter to start game</Text>
        </Box>
      </Box>
    )
  }

  if (gameState === 'gameover') {
    const timeElapsed = endTime - startTime
    const winner =
      scores.player > scores.ai
        ? 'Player'
        : scores.ai > scores.player
        ? 'AI'
        : 'Nobody'

    return (
      <Box flexDirection="column" alignItems="center" padding={1}>
        <Text bold>Game Over!</Text>
        <Box marginY={1}>
          <Text>{winner} wins!</Text>
        </Box>
        <Box marginY={1}>
          <Text>Time: {formatTime(timeElapsed)}</Text>
        </Box>
        <Box marginY={1}>
          <Text>Scores - Player: {scores.player}</Text>
          {gameMode === 'vs-ai' && <Text> | AI: {scores.ai}</Text>}
        </Box>
        <Box flexDirection="column" marginY={1}>
          <Text>Press 'n' for new game</Text>
          <Text>Press 'q' to quit</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text>tConcentration</Text>
      <Text>Mode: {gameMode === 'single' ? 'Single Player' : 'vs AI'}</Text>
      <Text>
        Player Score: {scores.player} |{' '}
        {gameMode === 'vs-ai' ? `AI Score: ${scores.ai}` : ''}
      </Text>
      <Text>Time: {formatTime(Date.now() - startTime)}</Text>
      <Text>{message}</Text>
      <Box flexDirection="column" marginY={1}>
        {Array.from({ length: gridSize }, (_, row) => (
          <Box key={row} gap={1}>
            {Array.from({ length: gridSize }, (_, col) => {
              const index = row * gridSize + col
              const card = grid[index]
              return (
                <Box key={col}>
                  {card && (
                    <>
                      {gridSize >= 8 ? (
                        <MiniCard
                          suit={card.suit}
                          value={card.value}
                          faceUp={
                            flippedIndices.includes(index) ||
                            matchedIndices.includes(index)
                          }
                          selected={selectedIndex === index}
                          variant={gridSize >= 12 ? 'micro' : 'mini'}
                        />
                      ) : (
                        <Card
                          suit={card.suit}
                          value={card.value}
                          faceUp={
                            flippedIndices.includes(index) ||
                            matchedIndices.includes(index)
                          }
                          selected={selectedIndex === index}
                          variant={
                            gridSize === 2
                              ? 'simple'
                              : gridSize === 4
                              ? 'simple'
                              : 'minimal'
                          }
                        />
                      )}
                    </>
                  )}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
      <Text>Current Player: {currentPlayer === 'player' ? 'You' : 'AI'}</Text>
      {currentPlayer === 'player' && (
        <Box flexDirection="column">
          <Text>Controls:</Text>
          <Text>- Arrow keys to move</Text>
          <Text>- Space to flip a card</Text>
        </Box>
      )}
    </Box>
  )
}

function createPairedDeck() {
  // Create a standard deck
  const standardDeck = [
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
  ]

  // Group cards by their value
  const groupedByValue = standardDeck.reduce<Map<TCardValue, CardProps[]>>(
    (acc, card) => {
      if ('value' in card && 'suit' in card) {
        const value = card.value as TCardValue
        const cards = acc.get(value) || []
        cards.push({
          value,
          suit: card.suit as TSuit,
          faceUp: false,
          selected: false,
        })
        acc.set(value, cards)
      }
      return acc
    },
    new Map()
  )

  // Create array of pairs, ensuring each value appears an even number of times
  const pairs: [CardProps, CardProps][] = []
  groupedByValue.forEach((cards) => {
    // Create as many pairs as possible from the available cards
    while (cards.length >= 2) {
      const card1 = cards.pop()!
      const card2 = cards.pop()!
      pairs.push([
        { ...card1, faceUp: false },
        { ...card2, faceUp: false },
      ])
    }
  })

  // Randomize the order of pairs
  pairs.sort(() => Math.random() - 0.5)

  // Flatten pairs into sequential array: [card1, card1, card2, card2, ...]
  return pairs.flatMap((pair) => pair)
}

export default function App() {
  // Create paired deck with sequential pairs
  const pairedDeck = createPairedDeck()

  return (
    <DeckProvider initialCards={pairedDeck}>
      <Game />
    </DeckProvider>
  )
}
