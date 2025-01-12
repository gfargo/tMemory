export const COLORS = {
  p1: '#2ECCB6',    // Green
  p2: '#306D91',    // Sky Blue
  ai: '#E379A4',    // Red
  info: '#B6FFF2',  // Sky Blue
  // warn: '#ffa500',  // Orange
  // warn: '#FD5C5A',  // Orange
  warn: '#FB8A61',  // Orange
  gold: '#ffd700',  // Gold
  // dim: '#3C346A'    // Gray
  dim: '#666666'    // Gray
} as const

export type ColorKey = keyof typeof COLORS