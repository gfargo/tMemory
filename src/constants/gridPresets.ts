import { GridDimension } from "../types/game.js"

export const SQUARE_GRIDS: GridDimension[] = [
  { rows: 2, cols: 2 },   // 4 cards (2 pairs)
  { rows: 4, cols: 4 },   // 16 cards (8 pairs)
  { rows: 6, cols: 6 },   // 36 cards (18 pairs)
  { rows: 8, cols: 8 },   // 64 cards (32 pairs)
  { rows: 10, cols: 10 }, // 100 cards (50 pairs)
  { rows: 12, cols: 12 }, // 144 cards (72 pairs)
]

export const RECTANGULAR_GRIDS: GridDimension[] = [
  { rows: 2, cols: 4 },   // 8 cards (4 pairs)
  { rows: 2, cols: 6 },   // 12 cards (6 pairs)
  { rows: 3, cols: 6 },   // 18 cards (9 pairs)
  { rows: 3, cols: 8 },   // 24 cards (12 pairs)
]

export const ALL_PRESET_GRIDS = [...SQUARE_GRIDS, ...RECTANGULAR_GRIDS].sort(
  (a, b) => a.rows * a.cols - b.rows * b.cols
)

export const MAX_GRID_SIZE = 12
export const MAX_TOTAL_CARDS = 144 // 12x12

export const isValidGrid = (dim: GridDimension): boolean => {
  return (
    dim.rows > 0 &&
    dim.cols > 0 &&
    dim.rows <= MAX_GRID_SIZE &&
    dim.cols <= MAX_GRID_SIZE &&
    (dim.rows * dim.cols) % 2 === 0 && // Ensure even number of cards
    dim.rows * dim.cols <= MAX_TOTAL_CARDS
  )
}