import { Box, Text, useApp, useInput } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import React from 'react'
import { GameLayout } from "../../components/layout/GameLayout.js"
import { COLORS } from "../../constants/colors.js"
import { useGame } from "../../context/GameContext/index.js"
import { useHighScores } from "../../context/HighScoreContext/index.js"
import { formatTime } from "../../utils/time.js"
import { FinalScore } from "./components/FinalScore.js"
import { WinnerDisplay } from "./components/WinnerDisplay.js"

export const GameOver: React.FC = () => {
  const { exit } = useApp()
  const { state, dispatch } = useGame()

  useInput((input) => {
    if (input === 'n') {
      dispatch({ type: 'SET_GAME_STATE', payload: 'welcome' })
    } else if (input === 'q') {
      exit()
    }
  })
  const { getHighScore, isNewHighScore, saveHighScore } = useHighScores()

  // Check and save high scores
  React.useEffect(() => {
    const timeElapsed = endTime - startTime
    const isNew = isNewHighScore(timeElapsed, gridDimension, gameMode)
    
    // Track scores for all game modes
    if (isNew) {
      saveHighScore({
        time: timeElapsed,
        rows: gridDimension.rows,
        cols: gridDimension.cols,
        gameMode,
        date: new Date().toISOString(),
      })
      dispatch({ type: 'SET_IS_NEW_RECORD', payload: true })
    }
    dispatch({ type: 'SET_SHOULD_TRACK_SCORE', payload: true })
  }, [])
  const {
    endTime,
    startTime,
    scores,
    gameMode,
    gridDimension,
    winner,
    shouldTrackScore,
    isNewRecord,
  } = state

  const timeElapsed = endTime - startTime
  const currentHighScore = getHighScore(gameMode, gridDimension)

  return (
    <GameLayout>
      <Box flexDirection="column" alignItems="center" padding={1}>
        <Box flexDirection="column" alignItems="center" height={12}>
          <Gradient name="cristal">
            <BigText text="Game" />
          </Gradient>
          <Gradient name="cristal">
            <BigText text="Over" />
          </Gradient>
        </Box>

        <WinnerDisplay winner={winner} />
        <FinalScore scores={scores} gameMode={gameMode} />

        <Box marginY={1} flexDirection="column" alignItems="center">
          <Text color={COLORS.info}>
            Time: <Text bold>{formatTime(timeElapsed)}</Text>
          </Text>
          {shouldTrackScore &&
            (isNewRecord ? (
              <Text color={COLORS.gold} bold>
                ★ New Record{gameMode === 'vs-player' ? ` by ${winner}` : ''}! ★
              </Text>
            ) : (
              currentHighScore && (
                <Text color={COLORS.dim}>
                  Best: <Text bold>{formatTime(currentHighScore.time)}</Text>
                </Text>
              )
            ))}
        </Box>

        <Box flexDirection="column" alignItems="center" marginY={1}>
          <Text color={COLORS.dim}>
            Press <Text color={COLORS.p1} bold>N</Text> for new game
          </Text>
          <Text color={COLORS.dim}>
            Press <Text color={COLORS.ai} bold>Q</Text> to quit
          </Text>
        </Box>
      </Box>
    </GameLayout>
  )
}