import React from 'react'
import { Card as InkCard, MiniCard } from 'ink-playing-cards'
import { GridDimension, GameCard } from "../../../types/game.js"
import { getCardVariant } from "../../../utils/grid.js"

interface CardWrapperProps {
  card: GameCard
  gridDimension: GridDimension
  faceUp: boolean
  selected: boolean
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  card,
  gridDimension,
  faceUp,
  selected,
}) => {
  const { component, variant } = getCardVariant(gridDimension)
  const commonProps = {
    suit: card.suit,
    value: card.value,
    faceUp,
    selected,
  }

  return component === 'MiniCard' ? (
    <MiniCard {...commonProps} variant={variant as 'mini' | 'micro'} />
  ) : (
    <InkCard {...commonProps} variant={variant as 'simple' | 'minimal' | 'ascii'} />
  )
}