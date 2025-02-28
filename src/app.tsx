import { DeckProvider, createStandardDeck } from 'ink-playing-cards'
import React from 'react'
import { GameProvider, useGame } from './context/GameContext/index.js'
import { HighScoreProvider } from './context/HighScoreContext/index.js'
import { GameOver } from './screens/GameOver/index.js'
import { GameScreen } from './screens/GameScreen/index.js'
import LeaderboardScreen from './screens/Leaderboard/index.js'
import { MainMenu } from './screens/MainMenu/index.js'

const GameRouter: React.FC = () => {
  const { state } = useGame()

  switch (state.gameState) {
    case 'welcome':
      return <MainMenu />
    case 'playing':
      return <GameScreen />
    case 'gameover':
      return <GameOver />
    case 'leaderboard':
      return <LeaderboardScreen />
    default:
      return <MainMenu />
  }
}

const createPairedDeck = () => {
  // Create multiple standard decks to ensure we have enough cards
  const standardDeck = [
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
    ...createStandardDeck(),
  ]

  return standardDeck
}

interface AppProps {
  initialMode?: 'single' | 'vs-player' | 'vs-ai'
  initialGrid?: { rows: number; cols: number }
}

export const App: React.FC<AppProps> = ({ initialMode, initialGrid }) => {
  // Create paired deck with sequential pairs
  const pairedDeck = createPairedDeck()

  return (
    <HighScoreProvider>
      <DeckProvider initialCards={pairedDeck}>
        <GameProvider initialMode={initialMode} initialGrid={initialGrid}>
          <GameRouter />
        </GameProvider>
      </DeckProvider>
    </HighScoreProvider>
  )
}

export default App
