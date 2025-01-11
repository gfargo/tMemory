import Conf from 'conf'
import { Box, Text, useApp, useInput } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import type { CardProps, TCardValue, TSuit } from 'ink-playing-cards'
import {
  Card,
  createStandardDeck,
  DeckProvider,
  MiniCard,
  useDeck,
} from 'ink-playing-cards'
import React, { useEffect, useState } from 'react'

interface HighScore {
  time: number
  gridSize: number
  gameMode: 'single' | 'vs-ai'
  date: string
}

// Initialize Conf with schema validation
const config = new Conf({
  projectName: 'tmemory',
  schema: {
    scores: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          time: { type: 'number' },
          gridSize: { type: 'number' },
          gameMode: { type: 'string', enum: ['single', 'vs-ai'] },
          date: { type: 'string' }
        },
        required: ['time', 'gridSize', 'gameMode', 'date']
      },
      default: {}
    }
  }
})

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}

const getHighScores = (): Record<string, HighScore> => {
  return config.get('scores') as Record<string, HighScore>
}

const saveHighScore = (key: string, score: HighScore) => {
  const scores = getHighScores()
  scores[key] = score
  config.set('scores', scores)
}

const getHighScoreKey = (
  gridSize: number,
  gameMode: 'single' | 'vs-ai'
): string => {
  return `${gridSize}x${gridSize}-${gameMode}`
}

const isNewHighScore = (
  time: number,
  gridSize: number,
  gameMode: 'single' | 'vs-ai'
): boolean => {
  const scores = getHighScores()
  const key = getHighScoreKey(gridSize, gameMode)
  return !scores[key] || time < scores[key].time
}

const LiveTimer: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <Text color="#87ceeb">⏱️ {formatTime(currentTime - startTime)}</Text>
}

type GameState = 'welcome' | 'playing' | 'gameover'

interface GameCard {
  suit: TSuit
  value: TCardValue
  faceUp: boolean
  selected?: boolean
}

interface GameScores {
  player: number
  ai: number
}

const Game: React.FC = () => {
  const { exit } = useApp()
  const { hand, deck } = useDeck()
  const [grid, setGrid] = useState<GameCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedIndices, setMatchedIndices] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [scores, setScores] = useState<GameScores>({ player: 0, ai: 0 })
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

  // formatTime is now a shared utility function

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
      <Box flexDirection="column" alignItems="center"   padding={1}>
        {/* <Gradient name="cristal">
          <Text bold>
            tMemory
          </Text>
        </Gradient> */}
        <Box >
            <Gradient name="cristal">
              <BigText text="Memory" />
            </Gradient>
        </Box>

        <Box marginY={1} marginTop={2}>
          <Text>Game Mode: </Text>
          <Text color={gameMode === 'single' ? '#00ff00' : '#666666'} bold>
            Single Player
          </Text>
          <Text> / </Text>
          <Text color={gameMode === 'vs-ai' ? '#00ff00' : '#666666'} bold>
            vs AI
          </Text>
        </Box>

        <Box marginY={1}>
          <Text color="#87ceeb">
            Grid Size:{' '}
            <Text bold>
              {gridSize}x{gridSize}
            </Text>{' '}
            ({Math.floor((gridSize * gridSize) / 2)} pairs)
          </Text>
        </Box>

        {/* High Score Display */}
        <Box marginY={1} flexDirection="column" alignItems="center">
          {(() => {
            const scores = getHighScores()
            const currentHighScore = scores[getHighScoreKey(gridSize, gameMode)]
            return currentHighScore ? (
              <>
                <Text color="#ffd700" bold>
                  Best Time:
                </Text>
                <Text color="#ffd700">{formatTime(currentHighScore.time)}</Text>
              </>
            ) : (
              <Text color="#666666" dimColor>
                No records yet!
              </Text>
            )
          })()}
        </Box>

        <Box flexDirection="column" marginY={1}>
          <Text bold color="#ffa500">
            Controls:
          </Text>
          <Text>
            <Text bold>←/→</Text> <Text dimColor>Change game mode</Text>
          </Text>
          <Text>
            <Text bold>↑/↓</Text> <Text dimColor>Adjust grid size</Text>
          </Text>
          <Text>
            <Text bold>Space</Text> <Text dimColor>Start game</Text>
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="#666666">
            Press{' '}
            <Text color="#00ff00" bold>
              Space
            </Text>{' '}
            to begin!
          </Text>
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

    // Only track high scores for player wins in single player mode
    // or when player beats AI in vs-ai mode
    const shouldTrackScore =
      (gameMode === 'single' && winner === 'Player') ||
      (gameMode === 'vs-ai' && winner === 'Player')

    const isNewRecord =
      shouldTrackScore && isNewHighScore(timeElapsed, gridSize, gameMode)

    // Save high score if it's a new record
    if (isNewRecord) {
      const key = getHighScoreKey(gridSize, gameMode)
      saveHighScore(key, {
        time: timeElapsed,
        gridSize,
        gameMode,
        date: new Date().toISOString(),
      })
    }

    // Get current high score for this configuration
    const highScores = getHighScores()
    const currentHighScore = highScores[getHighScoreKey(gridSize, gameMode)]

    return (
      <Box flexDirection="column" alignItems="center" padding={1}>
        <Box flexDirection="column" alignItems="center" height={12}>
          <Gradient name="cristal">
            <BigText text="Game" />
          </Gradient>
          <Gradient name="cristal">
            <BigText text="Over" />
          </Gradient>
        </Box>

        <Box marginY={1}>
          <Text
            bold
            color={
              winner === 'Player'
                ? '#00ff00'
                : winner === 'AI'
                ? '#ff6b6b'
                : '#ffa500'
            }
          >
            {winner === 'Player'
              ? 'You Win!'
              : winner === 'AI'
              ? 'AI Wins!'
              : "It's a Tie!"}
          </Text>
        </Box>

        <Box marginY={1} flexDirection="column" alignItems="center">
          <Text color="#87ceeb">
            Time: <Text bold>{formatTime(timeElapsed)}</Text>
          </Text>
          {shouldTrackScore &&
            (isNewRecord ? (
              <Text color="#ffd700" bold>
                ★ New Record! ★
              </Text>
            ) : (
              currentHighScore && (
                <Text color="#666666">
                  Best: <Text bold>{formatTime(currentHighScore.time)}</Text>
                </Text>
              )
            ))}
        </Box>

        <Box marginY={1} flexDirection="column" alignItems="center">
          <Text>Final Score:</Text>
          <Box gap={2}>
            <Text color="#00ff00">
              P1 <Text bold>{String(scores.player)}</Text>
            </Text>
            {gameMode === 'vs-ai' && (
              <Text color="#ff6b6b">
                AI: <Text bold>{String(scores.ai)}</Text>
              </Text>
            )}
          </Box>
        </Box>

        <Box flexDirection="column" alignItems="center" marginY={1}>
          <Text color="#666666">
            Press{' '}
            <Text color="#00ff00" bold>
              N
            </Text>{' '}
            for new game
          </Text>
          <Text color="#666666">
            Press{' '}
            <Text color="#ff0000" bold dimColor>
              Q
            </Text>{' '}
            to quit
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="singleDouble" paddingX={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Gradient name="cristal">
          <Text>tMemory</Text>
        </Gradient>
        <Text color="#87ceeb">
          [{gameMode === 'single' ? 'Single Player' : 'vs AI'}]
        </Text>
      </Box>

      {/* Score and Timer */}
      <Box justifyContent="space-between" marginBottom={1}>
        <LiveTimer startTime={startTime} />
        <Box>
          <Text dimColor>Scores{` `}</Text>
          <Text>
            P1{' '}
            <Text color="#00ff00" bold>
              {scores?.player || 0}
            </Text>
          </Text>
          {gameMode === 'vs-ai' && (
            <Text>
              {' '}
              |{' '}
              <Text>
                AI{' '}
                <Text bold color="#ff6b6b">
                  {scores?.ai || 0}
                </Text>
              </Text>
            </Text>
          )}
        </Box>
      </Box>

      {/* Game Message */}
      {message && (
        <Box marginBottom={1} justifyContent="center">
          <Text color="#ffa500">{message}</Text>
        </Box>
      )}

      {/* Game Grid - Centered */}
      <Box
        flexDirection="column"
        alignItems="center"
        flexGrow={1}
        // justifyContent="center"
      >
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

      {/* Footer */}
      <Box flexDirection="column" marginTop={1}>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="#87ceeb">
            Current Player:{' '}
            <Text bold>{currentPlayer === 'player' ? 'You' : 'AI'}</Text>
          </Text>
        </Box>
        {currentPlayer === 'player' && (
          <Box flexDirection="column">
            <Text bold color="#ffa500">
              Controls:
            </Text>
            <Text>
              ←/→/↑/↓ <Text dimColor>Move</Text>
            </Text>
            <Text>
              Space <Text dimColor>Flip card</Text>
            </Text>
          </Box>
        )}
      </Box>
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
