import { Box } from 'ink'
import React from 'react'

interface GameLayoutProps {
  children: React.ReactNode
  padding?: number
  centered?: boolean
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  padding = 1,
  centered = true,
}) => {
  return (
    <Box
      flexDirection="column"
      alignItems={centered ? 'center' : 'flex-start'}
      padding={padding}
    >
      {children}
    </Box>
  )
}