import { Box, Text, useApp, useInput } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import React, { useState } from 'react'
import { submitScore } from '../../api/scoreApi.js'
import { GameLayout } from "../../components/layout/GameLayout.js"
import { COLORS } from "../../constants/colors.js"
import { useGame } from "../../context/GameContext/index.js"
import { useHighScores } from "../../context/HighScoreContext/index.js"
import { formatTime } from "../../utils/time.js"
import { FinalScore } from "./components/FinalScore.js"
import { Leaderboard } from "./components/Leaderboard.js"
import { PlayerNameInput } from "./components/PlayerNameInput.js"
import { WinnerDisplay } from "./components/WinnerDisplay.js"

 
export const GameOver: React.FC = () => {
  const { exit } = useApp()
  const { state, dispatch } = useGame()
  const [nameSubmitted, setNameSubmitted] = useState(false)
  const [scoreChecked, setScoreChecked] = useState(false)

  useInput((input) => {
    if (nameSubmitted && input === 'n') {
      dispatch({ type: 'SET_GAME_STATE', payload: 'welcome' });
    } else if (nameSubmitted && input === 'q') {
      exit();
    } else if (input.toLowerCase() === 'l') {
      dispatch({ type: 'SET_GAME_STATE', payload: 'leaderboard' });
    }
  })
  const { getHighScore, isNewHighScore, saveHighScore, getDeviceId } = useHighScores()

  // Check high scores
  React.useEffect(() => {
    const timeElapsed = endTime - startTime
    const isNew = isNewHighScore(timeElapsed, gridDimension, gameMode)
    
    if (isNew) {
      dispatch({ type: 'SET_IS_NEW_RECORD', payload: true })
    }
    
    dispatch({ type: 'SET_SHOULD_TRACK_SCORE', payload: true })
    setScoreChecked(true)
  }, [])

  // Handle player name submission
  const handleNameSubmit = async (playerName: string) => {
    const timeElapsed = endTime - startTime;
    const date = new Date().toISOString();
    const scoreData = {
      time: timeElapsed,
      rows: gridDimension.rows,
      cols: gridDimension.cols,
      gameMode,
      date,
      playerName,
      deviceId: getDeviceId(),
    };
    // Save the high score locally
    saveHighScore(scoreData);
    // Submit the score remotely via API
    try {
      const response = await submitScore(scoreData);
      console.log('Score submitted:', response.score);
    } catch (error) {
      console.error('Score submission error:', error);
    }
    setNameSubmitted(true);
  }
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
          <Gradient name="mind">
            <BigText text="Game" />
          </Gradient>
          <Gradient name="mind">
            <BigText text="Over" />
          </Gradient>
        </Box>

        <WinnerDisplay winner={winner} />
        <FinalScore scores={scores} gameMode={gameMode} />

        <Box flexDirection="column" alignItems="center">
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

        {scoreChecked && (
          <PlayerNameInput 
            isNewRecord={isNewRecord} 
            onNameSubmit={handleNameSubmit} 
          />
        )}

        {nameSubmitted && (
          <Leaderboard 
            gameMode={gameMode} 
            gridDimension={gridDimension} 
          />
        )}
          <Text color={COLORS.dim}>Press <Text color={COLORS.ai} bold>L</Text> to view leaderboard</Text>


        <Box flexDirection="column" alignItems="center" marginY={1}>
          <Text color={COLORS.dim}>
            {nameSubmitted ? (
              <>Press <Text color={COLORS.p1} bold>N</Text> for new game</>
            ) : (
              <>Enter your name to continue</>
            )}
          </Text>
          {nameSubmitted && (
            <Text color={COLORS.dim}>
              Press <Text color={COLORS.ai} bold>Q</Text> to quit
            </Text>
          )}
        </Box>
      </Box>
    </GameLayout>
  )
}