import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import React, { useEffect, useState } from 'react'
import { COLORS } from '../../../constants/colors.js'
import { useHighScores } from '../../../context/HighScoreContext/index.js'

interface PlayerNameInputProps {
  isNewRecord: boolean
  onNameSubmit: (name: string) => void
}

export const PlayerNameInput: React.FC<PlayerNameInputProps> = ({
  isNewRecord,
  onNameSubmit,
}) => {
  const { getPlayerName, setPlayerName } = useHighScores()
  const [name, setName] = useState(getPlayerName() || '')
  const [submitted, setSubmitted] = useState(false)

  // If not a new record, auto-submit the existing name
  useEffect(() => {
    if (!isNewRecord && name) {
      onNameSubmit(name)
      setSubmitted(true)
    }
  }, [isNewRecord, name, onNameSubmit])

  const handleSubmit = (value: string) => {
    const trimmedName = value.trim() || 'Anonymous'
    setPlayerName(trimmedName)
    onNameSubmit(trimmedName)
    setSubmitted(true)
  }

  if (submitted || (!isNewRecord && !name)) {
    return null
  }

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color={COLORS.gold}>
        {isNewRecord
          ? '🏆 New high score! Enter your name:'
          : 'Enter your name for the leaderboard:'}
      </Text>
      <Box marginTop={1}>
        <TextInput
          value={name}
          onChange={setName}
          onSubmit={handleSubmit}
          placeholder="Your name (max 12 chars)"
          showCursor
          focus
          // mask={useMask ? '*' : undefined}
          highlightPastedText
          // maxLength={12}
          
        />
      </Box>
    </Box>
  )
}