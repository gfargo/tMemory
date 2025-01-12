export const COLORS = {
  p1: '#00ff00',    // Green
  p2: '#87ceeb',    // Sky Blue
  ai: '#ff6b6b',    // Red
  info: '#87ceeb',  // Sky Blue
  warn: '#ffa500',  // Orange
  gold: '#ffd700',  // Gold
  dim: '#666666'    // Gray
} as const

export type ColorKey = keyof typeof COLORS