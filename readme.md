# tMemory 🃏

A terminal-based Memory/Concentration card game built with React Ink.

<!-- ![tmemory Demo](demo.gif) -->

## Features

- 🎮 Multiple game modes:
  - Single player
  - Player vs AI (🚧 in development)
- 📏 Adjustable grid sizes:
  - 2x2 (2 pairs)
  - 4x4 (8 pairs)
  - 6x6 (18 pairs)
  - 8x8 (32 pairs)
  - 10x10 (50 pairs)
  - 12x12 (72 pairs)
- ⏱️ Time tracking
- 🎯 Score tracking
- 🤖 Smart AI opponent
- 🎨 Beautiful card rendering with multiple variants
- ⌨️ Intuitive keyboard controls

## Installation

You can play tMemory without installing it by using `npx`:

```bash
npx tmemory
```

Or install it globally:

```bash
npm install -g tmemory
```

Then run:

```bash
tmemory
```

## How to Play

1. **Start Screen**:
   - Use ⬅️/➡️ arrows to select game mode (Single Player/vs AI)
   - Use ⬆️/⬇️ arrows to adjust grid size
   - Press Space or Enter to start game

2. **During Game**:
   - Use arrow keys to navigate the grid
   - Press Space to flip a card
   - Match pairs of cards to score points
   - In vs AI mode, take turns with the AI opponent

3. **Game Over**:
   - View your completion time
   - Check final scores
   - Press 'n' to start a new game
   - Press 'q' to quit

## Technologies Used

- [React](https://reactjs.org/)
- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [ink-playing-cards](https://github.com/gfargo/ink-playing-cards) - Card rendering
- [TypeScript](https://www.typescriptlang.org/)

## Contributing

Contributions are welcome! Love to hear any feedback or suggestions you have. Feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to [Vadim Demedes](https://github.com/vadimdemedes) for creating Ink

## Support

If you found this project helpful, please give it a ⭐️!
