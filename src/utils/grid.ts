import { GridDimension } from "../types/game.js"

export const renderGridPreview = (dim: GridDimension): string[] => {
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
    if (row < dim.rows - 1) lines.push()
  }
  
  return lines
}

type CardVariant = 'simple' | 'minimal' | 'ascii'
type MiniCardVariant = 'mini' | 'micro'

export const getCardVariant = (
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