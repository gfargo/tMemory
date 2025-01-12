import { Text } from 'ink'
import React, { useEffect, useState } from 'react'
import { COLORS } from "../../../constants/colors.js"
import { formatTime } from "../../../utils/time.js"

interface LiveTimerProps {
  startTime: number
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ startTime }) => {
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Text color={COLORS.info}>
      ⏱️ {formatTime(currentTime - startTime)}
    </Text>
  )
}