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

const COLORS = {
  p1: '#00ff00',    // Green
  p2: '#87ceeb',    // Sky Blue
  ai: '#ff6b6b',    // Red
  info: '#87ceeb',  // Sky Blue
  warn: '#ffa500',  // Orange
  gold: '#ffd700',  // Gold
  dim: '#666666'    // Gray
} as const

interface HighScore {
  time: number
  gridSize: number
  gameMode: 'single' | 'vs-ai' | 'vs-player'
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
          gameMode: { type: 'string', enum: ['single', 'vs-ai', 'vs-player'] },
          date: { type: 'string' },
        },
        required: ['time', 'gridSize', 'gameMode', 'date'],
      },
      default: {},
    },
  },
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
  grid: GridDimension | number,
  gameMode: 'single' | 'vs-ai' | 'vs-player'
): string => {
  if (typeof grid === 'number') {
    // Support old format for backward compatibility
    return `${grid}x${grid}-${gameMode}`
  }
  return `${grid.rows}x${grid.cols}-${gameMode}`
}

const isNewHighScore = (
  time: number,
  grid: GridDimension | number,
  gameMode: 'single' | 'vs-ai' | 'vs-player'
): boolean => {
  const scores = getHighScores()
  const key = getHighScoreKey(grid, gameMode)
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
type GridSelectionMode = 'preset' | 'custom'

interface GridDimension {
  rows: number
  cols: number
}

const SQUARE_GRIDS: GridDimension[] = [
  { rows: 2, cols: 2 }, // 4 cards (2 pairs)
  { rows: 4, cols: 4 }, // 16 cards (8 pairs)
  { rows: 6, cols: 6 }, // 36 cards (18 pairs)
  { rows: 8, cols: 8 }, // 64 cards (32 pairs)
  { rows: 10, cols: 10 }, // 100 cards (50 pairs)
  { rows: 12, cols: 12 }, // 144 cards (72 pairs)
]

const RECTANGULAR_GRIDS: GridDimension[] = [
  { rows: 2, cols: 4 }, // 8 cards (4 pairs)
  { rows: 2, cols: 6 }, // 12 cards (6 pairs)
  { rows: 3, cols: 6 }, // 18 cards (9 pairs)
  { rows: 3, cols: 8 }, // 24 cards (12 pairs)
]

const ALL_PRESET_GRIDS = [...SQUARE_GRIDS, ...RECTANGULAR_GRIDS].sort(
  (a, b) => a.rows * a.cols - b.rows * b.cols
)

const isValidGrid = (dim: GridDimension): boolean => {
  return (
    dim.rows > 0 &&
    dim.cols > 0 &&
    dim.rows <= 12 &&
    dim.cols <= 12 &&
    (dim.rows * dim.cols) % 2 === 0 && // Ensure even number of cards
    dim.rows * dim.cols <= 144 // Max same as 12x12
  )
}

// Helper to render a grid preview using ASCII/Unicode
type CardVariant = 'simple' | 'minimal' | 'ascii'
type MiniCardVariant = 'mini' | 'micro'

const getCardVariant = (
  dim: GridDimension
): { component: 'Card' | 'MiniCard'; variant: CardVariant | MiniCardVariant } => {
  const totalCards = dim.rows * dim.cols
  const maxDim = Math.max(dim.rows, dim.cols)
  
  if (totalCards >= 72 || maxDim >= 12) {
    return { component: 'MiniCard', variant: 'micro' }
  } else if (totalCards >= 32 || maxDim >= 8) {
    return { component: 'MiniCard', variant: 'mini' }
  } else {
    return { component: 'Card', variant: totalCards <= 8 ? 'simple' : 'minimal' }
  }
}

const renderGridPreview = (dim: GridDimension): string[] => {
  const lines: string[] = []
  const topChar = '┌─┐'
  const midChar = '│?│'
  const botChar = '└─┘'
  const separator = ' '

  for (let row = 0; row < dim.rows; row++) {
    // Top of cards
    lines.push(Array(dim.cols).fill(topChar).join(separator))
    // Middle of cards
    lines.push(Array(dim.cols).fill(midChar).join(separator))
    // Bottom of cards
    lines.push(Array(dim.cols).fill(botChar).join(separator))
    // Add spacing between rows
    if (row < dim.rows - 1) lines.push('')
  }

  return lines
}

interface GameCard {
  suit: TSuit
  value: TCardValue
  faceUp: boolean
  selected?: boolean
}

interface GameScores {
  p1: number
  p2: number
  ai: number
}

const Game: React.FC = () => {
  const { exit } = useApp()
  const { hand, deck } = useDeck()
  const [grid, setGrid] = useState<GameCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedIndices, setMatchedIndices] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2' | 'ai'>('p1')
  const [scores, setScores] = useState<GameScores>({ p1: 0, p2: 0, ai: 0 })
  const [message, setMessage] = useState('')
  const [gameMode, setGameMode] = useState<'single' | 'vs-ai' | 'vs-player'>('single')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [gameState, setGameState] = useState<GameState>('welcome')
  const [gridDimension, setGridDimension] = useState<GridDimension>({
    rows: 4,
    cols: 4,
  }) // 4x4 default
  const [gridSelectionMode, setGridSelectionMode] =
    useState<GridSelectionMode>('preset')

  const [currentPresetIndex, setCurrentPresetIndex] = useState(1) // Index of 4x4 in ALL_PRESET_GRIDS
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)

  const startNewGame = () => {
    // Calculate number of pairs based on grid dimensions
    const numPairs = Math.floor((gridDimension.rows * gridDimension.cols) / 2)
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
    setScores({ p1: 0, p2: 0, ai: 0 })
    setCurrentPlayer('p1')
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
          `${currentPlayer === 'ai' ? 'AI' : currentPlayer.toUpperCase()} found a match!`
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
    switch (gameMode) {
      case 'vs-ai':
        setCurrentPlayer(currentPlayer === 'p1' ? 'ai' : 'p1')
        if (currentPlayer === 'p1') {
          setTimeout(playAI, 1000)
        }
        break
      case 'vs-player':
        setCurrentPlayer(currentPlayer === 'p1' ? 'p2' : 'p1')
        break
      case 'single':
        // No player switching in single player mode
        break
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
      if (input === 'm' || input === 'M') {
        setGridSelectionMode((prev) =>
          prev === 'preset' ? 'custom' : 'preset'
        )
        return
      }

      if (input === 'g' || input === 'G') {
        setGameMode((prev) => {
          switch (prev) {
            case 'single': return 'vs-player'
            case 'vs-player': return 'vs-ai'
            case 'vs-ai': return 'single'
          }
        })
        return
      }

      if (gridSelectionMode === 'preset') {
        if (
          key.upArrow &&
          currentPresetIndex < ALL_PRESET_GRIDS.length - 1
        ) {
          const nextIndex = currentPresetIndex + 1
          const nextGrid = ALL_PRESET_GRIDS[nextIndex]
          if (nextGrid) {
            setCurrentPresetIndex(nextIndex)
            setGridDimension(nextGrid)
          }
        } else if (key.downArrow && currentPresetIndex > 0) {
          const nextIndex = currentPresetIndex - 1
          const nextGrid = ALL_PRESET_GRIDS[nextIndex]
          if (nextGrid) {
            setCurrentPresetIndex(nextIndex)
            setGridDimension(nextGrid)
          }
        }
      } else {
        // custom mode
        if (key.leftArrow) {
          setGridDimension((prev) => {
            const next = { ...prev, cols: Math.max(prev.cols - 1, 1) }
            return isValidGrid(next) ? next : prev
          })
        } else if (key.rightArrow) {
          setGridDimension((prev) => {
            const next = { ...prev, cols: Math.min(prev.cols + 1, 12) }
            return isValidGrid(next) ? next : prev
          })
        } else if (key.upArrow) {
          setGridDimension((prev) => {
            const next = { ...prev, rows: Math.min(prev.rows + 1, 12) }
            return isValidGrid(next) ? next : prev
          })
        } else if (key.downArrow) {
          setGridDimension((prev) => {
            const next = { ...prev, rows: Math.max(prev.rows - 1, 1) }
            return isValidGrid(next) ? next : prev
          })
        }
      }

      if (input === ' ' || input === 'enter') {
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

    if (currentPlayer === 'ai') return

    if (key.leftArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
    } else if (key.rightArrow) {
      setSelectedIndex(Math.min(grid.length - 1, selectedIndex + 1))
    } else if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - gridDimension.cols))
    } else if (key.downArrow) {
      setSelectedIndex(
        Math.min(grid.length - 1, selectedIndex + gridDimension.cols)
      )
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
        <Box height={6}>
          <Gradient name="cristal">
            <BigText text="Memory" />
          </Gradient>
        </Box>

        <Box marginY={1} marginTop={2}>
          <Text>Game Mode: </Text>
          <Text color={gameMode === 'single' ? COLORS.p1 : COLORS.dim} bold>
            Single Player
          </Text>
          <Text> / </Text>
          <Text color={gameMode === 'vs-player' ? COLORS.p2 : COLORS.dim} bold>
            P1 vs P2
          </Text>
          <Text> / </Text>
          <Text color={gameMode === 'vs-ai' ? COLORS.ai : COLORS.dim} bold>
            vs AI
          </Text>
        </Box>

        <Box marginY={1} flexDirection="column" alignItems="center">
          <Box>
            <Text color="#87ceeb">
              Grid Size [{gridSelectionMode}]:{' '}
              <Text bold>
                {gridDimension.rows}x{gridDimension.cols}
              </Text>{' '}
              ({Math.floor((gridDimension.rows * gridDimension.cols) / 2)}{' '}
              pairs)
            </Text>
          </Box>

          {gridSelectionMode === 'custom' && (
            <Box flexDirection="column" alignItems="center" marginTop={1}>
              <Box>
                <Text>
                  Rows:{' '}
                  <Text bold color="#00ff00">
                    {gridDimension.rows}
                  </Text>
                  <Text> | </Text>
                  Cols:{' '}
                  <Text bold color="#00ff00">
                    {gridDimension.cols}
                  </Text>
                </Text>
              </Box>

              {/* Grid Preview */}
              <Box flexDirection="column" marginTop={1}>

                {renderGridPreview(gridDimension).map((line, i) => (
                  <Text
                    key={i}
                    color={line.includes('?') ? '#87ceeb' : '#666666'}
                  >
                    {line}
                  </Text>
                ))}
                <Text dimColor>
                  Total: {gridDimension.rows * gridDimension.cols} cards (
                  {Math.floor((gridDimension.rows * gridDimension.cols) / 2)}{' '}
                  pairs)
                </Text>
              </Box>
            </Box>
          )}
        </Box>

        {/* High Score Display */}
        <Box marginY={1} flexDirection="column" alignItems="center">
          {(() => {
            const scores = getHighScores()
            const currentHighScore =
              scores[getHighScoreKey(gridDimension, gameMode)]
            return currentHighScore ? (
              <>
                <Text color={COLORS.gold} bold>
                  Best Time{gameMode === 'vs-player' ? ' (Any Player)' : ''}:
                </Text>
                <Text color={COLORS.gold}>{formatTime(currentHighScore.time)}</Text>
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
            <Text bold>M</Text>{' '}
            <Text dimColor>
              Switch{' '}
              {gridSelectionMode === 'preset' ? 'to custom' : 'to preset'} mode
            </Text>
          </Text>
          <Text>
            <Text bold>G</Text> <Text dimColor>Change game mode</Text>
          </Text>
          {gridSelectionMode === 'preset' ? (
            <Text>
              <Text bold>↑/↓</Text>{' '}
              <Text dimColor>Cycle through grid sizes</Text>
            </Text>
          ) : (
            <>
              <Text>
                <Text bold>←/→</Text> <Text dimColor>Adjust columns</Text>
              </Text>
              <Text>
                <Text bold>↑/↓</Text> <Text dimColor>Adjust rows</Text>
              </Text>
            </>
          )}
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
    const getWinner = () => {
      if (gameMode === 'vs-ai') {
        if (scores.p1 > scores.ai) return 'Player'
        if (scores.ai > scores.p1) return 'AI'
        return 'Nobody'
      } else if (gameMode === 'vs-player') {
        if (scores.p1 > scores.p2) return 'P1'
        if (scores.p2 > scores.p1) return 'P2'
        return 'Nobody'
      } else {
        return 'Player'
      }
    }
    const winner = getWinner()

    // Track high scores for:
    // - Player wins in single player mode
    // - Player wins against AI
    // - Both P1 and P2 wins in vs-player mode (but not ties)
    const shouldTrackScore =
      (gameMode === 'single' && winner === 'Player') ||
      (gameMode === 'vs-ai' && winner === 'Player') ||
      (gameMode === 'vs-player' && (winner === 'P1' || winner === 'P2'))

    const isNewRecord =
      shouldTrackScore && isNewHighScore(timeElapsed, gridDimension, gameMode)

    // Save high score if it's a new record
    if (isNewRecord) {
      const key = getHighScoreKey(gridDimension, gameMode)
      saveHighScore(key, {
        time: timeElapsed,
        gridSize: Math.max(gridDimension.rows, gridDimension.cols), // For backward compatibility
        gameMode,
        date: new Date().toISOString(),
      })
    }

    // Get current high score for this configuration
    const highScores = getHighScores()
    const currentHighScore =
      highScores[getHighScoreKey(gridDimension, gameMode)]

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
              winner === 'Player' || winner === 'P1'
                ? COLORS.p1
                : winner === 'P2'
                ? COLORS.p2
                : winner === 'AI'
                ? COLORS.ai
                : COLORS.warn
            }
          >
            {winner === 'Player'
              ? 'You Win!'
              : winner === 'P1'
              ? 'P1 Wins!'
              : winner === 'P2'
              ? 'P2 Wins!'
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
              <Text color={COLORS.gold} bold>
                ★ New Record{gameMode === 'vs-player' ? ` by ${winner}` : ''}! ★
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
            <Text color={COLORS.p1}>
              P1 <Text bold>{String(scores.p1)}</Text>
            </Text>
            {gameMode === 'vs-ai' ? (
              <Text color={COLORS.ai}>
                AI: <Text bold>{String(scores.ai)}</Text>
              </Text>
            ) : gameMode === 'vs-player' && (
              <Text color={COLORS.p2}>
                P2: <Text bold>{String(scores.p2)}</Text>
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
            <Text color={COLORS.p1} bold>
              {scores?.p1 || 0}
            </Text>
          </Text>
          {(gameMode === 'vs-player' || gameMode === 'vs-ai') && (
            <Text>
              {' '}
              |{' '}
              <Text>
                {gameMode === 'vs-ai' ? 'AI' : 'P2'}{' '}
                <Text bold color={gameMode === 'vs-ai' ? COLORS.ai : COLORS.p2}>
                  {gameMode === 'vs-ai' ? scores?.ai || 0 : scores?.p2 || 0}
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
        {Array.from({ length: gridDimension.rows }, (_, row) => (
          <Box key={row} gap={1}>
            {Array.from({ length: gridDimension.cols }, (_, col) => {
              const index = row * gridDimension.cols + col
              const card = grid[index]
              return (
                <Box key={col}>
                  {card && (
                    <>
                      {(() => {
                        const { component, variant } = getCardVariant(gridDimension)
                        const commonProps = {
                          suit: card.suit,
                          value: card.value,
                          faceUp: flippedIndices.includes(index) || matchedIndices.includes(index),
                          selected: selectedIndex === index,
                        }
                        return component === 'MiniCard' ? (
                          <MiniCard {...commonProps} variant={variant as MiniCardVariant} />
                        ) : (
                          <Card {...commonProps} variant={variant as CardVariant} />
                        )
                      })()}
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
          {gameMode !== 'single' && (
            <Text color={COLORS.info}>
              Current Player:{' '}
              <Text bold color={
                currentPlayer === 'ai' ? COLORS.ai :
                currentPlayer === 'p1' ? COLORS.p1 :
                COLORS.p2
              }>
                {currentPlayer === 'ai' ? 'AI' : currentPlayer.toUpperCase()}
              </Text>
            </Text>
          )}
        </Box>
        {(currentPlayer === 'p1' || currentPlayer === 'p2') && (
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
