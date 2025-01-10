import { Box, Text, useInput } from 'ink'
import type { TCardValue, TSuit } from 'ink-playing-cards'
import {
  Card,
  createStandardDeck,
  DeckProvider,
  useDeck
} from 'ink-playing-cards'
import React, { useEffect, useState } from 'react'

interface GameCard {
  suit: TSuit
  value: TCardValue
  faceUp: boolean
  selected?: boolean
}

const MemoryGame: React.FC = () => {
  const { shuffle, draw, hand, players, playArea, deck } = useDeck()
  const [grid, setGrid] = useState<GameCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<TCardValue[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const [message, setMessage] = useState('')
  const [gameMode, setGameMode] = useState<'single' | 'vs-ai'>('single')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)

  const startNewGame = () => {
    // reset(
    //   new Zones.Deck([
    //     ...createStandardDeck(),
    //     ...createStandardDeck(),
    //     ...createStandardDeck(),
    //   ])
    // ) // Triple the deck
    console.log('Deck reset...', { deck })

    console.log('Starting new game...', { deckSize: deck.cards.length })
    shuffle()
    // const drawnCards = draw(16, 'player')
    draw(8, 'player')

    const gameCards = hand.cards as GameCard[]

    console.log('...Shuffled & Drawn...', {
      gameCards,
      // drawnCards,
      players,
      deck,
      playArea,
    })

    setGrid(gameCards)
    setFlippedIndices([])
    setMatchedPairs([])
    setScores({ player: 0, ai: 0 })
    setCurrentPlayer('player')
    setMessage(
      'Use arrow keys to move, space to flip a card, press "m" to change game mode.'
    )
    setIsGameStarted(true)
  }

  const flipCard = (index: number) => {
    const card = grid[index]
    if (
      flippedIndices.length === 2 ||
      flippedIndices.includes(index) ||
      !card ||
      matchedPairs.includes(card.value)
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
        setMatchedPairs([...matchedPairs, firstCard.value])
        setScores((prevScores) => ({
          ...prevScores,
          [currentPlayer]: prevScores[currentPlayer] + 1,
        }))
        setMessage(
          `${currentPlayer === 'player' ? 'You' : 'AI'} found a match!`
        )
        setFlippedIndices([])
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
      .filter(({ card }) => !matchedPairs.includes(card.value))

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

  useInput((input, key) => {
    if (!isGameStarted) {
      if (input === 's') {
        startNewGame()
      }
      return
    }

    if (currentPlayer !== 'player') return

    if (key.leftArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
    } else if (key.rightArrow) {
      setSelectedIndex(Math.min(grid.length - 1, selectedIndex + 1))
    } else if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 4))
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(grid.length - 1, selectedIndex + 4))
    } else if (input === ' ') {
      flipCard(selectedIndex)
    } else if (input === 'm') {
      setGameMode((prev) => (prev === 'single' ? 'vs-ai' : 'single'))
      setMessage(
        `Game mode changed to ${
          gameMode === 'single' ? 'vs AI' : 'single player'
        }`
      )
    } else if (input === 'n') {
      console.log('!!!Starting new game...')
      startNewGame()
    }
  })

  useEffect(() => {
    setMessage('Press "s" to start a new game!')
  }, [])

  useEffect(() => {
    if (matchedPairs.length === 8) {
      const winner =
        scores.player > scores.ai
          ? 'Player'
          : scores.ai > scores.player
          ? 'AI'
          : 'Nobody'
      setMessage(`Game Over! ${winner} wins! Press "n" to start a new game.`)
    }
  }, [matchedPairs, scores])

  if (!isGameStarted) {
    return (
      <Box flexDirection="column" alignItems="center">
        <Text>Welcome to Memory/Concentration Game!</Text>
        <Text>{message}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text>Memory/Concentration Game</Text>
      <Text>Mode: {gameMode === 'single' ? 'Single Player' : 'vs AI'}</Text>
      <Text>
        Player Score: {scores.player} |{' '}
        {gameMode === 'vs-ai' ? `AI Score: ${scores.ai}` : ''}
      </Text>
      <Text>{message}</Text>
      <Box flexDirection="column" marginY={1}>
        {[0, 1, 2, 3].map((row) => (
          <Box key={row}>
            {[0, 1, 2, 3].map((col) => {
              const index = row * 4 + col
              const card = grid[index]
              return (
                <Box key={col} marginRight={1} marginBottom={1}>
                  {card && (
                    <Card
                      suit={card.suit}
                      value={card.value}
                      faceUp={
                        flippedIndices.includes(index) ||
                        matchedPairs.includes(card.value)
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
      <Text>Current Player: {currentPlayer === 'player' ? 'You' : 'AI'}</Text>
      {currentPlayer === 'player' && (
        <Box flexDirection="column">
          <Text>Controls:</Text>
          <Text>- Arrow keys to move</Text>
          <Text>- Space to flip a card</Text>
          <Text>- M to change game mode</Text>
          <Text>- N to start new game</Text>
        </Box>
      )}
    </Box>
  )
}

export default function App() {
  return (
    <DeckProvider
      initialCards={[
        ...createStandardDeck(),
        ...createStandardDeck(),
        ...createStandardDeck(),
      ]}
    >
      <MemoryGame />
    </DeckProvider>
  )
}
