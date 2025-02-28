import { GameMode, GridDimension, HighScore } from '../../types/game.js'

export interface HighScoreContextValue {
  getHighScore: (mode: GameMode, grid: GridDimension) => HighScore | null
  saveHighScore: (score: HighScore) => void
  isNewHighScore: (time: number, grid: GridDimension, mode: GameMode) => boolean
  getAllHighScores: () => Record<string, HighScore[]>
  getLocalLeaderboard: (mode: GameMode, grid: GridDimension) => HighScore[]
  getPlayerName: () => string | undefined
  setPlayerName: (name: string) => void
  getDeviceId: () => string
  
  // TODO: Move this to a separate context
  onlineEnabled:  boolean;
  setOnlineEnabled: (enabled: boolean) => void;
}

export interface HighScoreConfig {
  scores: Record<string, HighScore[]>
  onlineEnabled: boolean
  playerName?: string
}
