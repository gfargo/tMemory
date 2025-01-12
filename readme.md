# tMemory 🃏

A terminal-based Memory/Concentration card game built with React, [Ink](https://github.com/vadimdemedes/ink), and [Ink Playing Cards](https://github.com/gfargo/ink-playing-cards/)

<!-- ![tmemory Demo](demo.gif) -->

## Features

- 🎮 Multiple game modes:
  - Single player (1P)
  - Player vs Player (2P)
  - Player vs AI
- 📏 Flexible grid sizes:
  - Preset grids (2x2 to 12x12)
  - Custom grids up to 12x12
  - Design your own grid layout!
- ⏱️ Speed Runs with Time tracking
- 🎯 Persistent High Score tracking
- 🤖 AI opponent

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
   - Press 'G' to switch game mode (1P/2P/AI)
   - Press 'M' to switch between preset and custom grid modes
   - In preset mode:
     - Use ⬆️/⬇️ arrows to cycle through predefined grid sizes
   - In custom mode:
     - Use ⬅️/➡️ arrows to adjust number of columns
     - Use ⬆️/⬇️ arrows to adjust number of rows
   - Press Space or Enter to start game

2. **During Game**:
   - Use arrow keys to navigate the grid
   - Press Space to flip a card
   - Match pairs of cards to score points
   - In 2P mode, players take turns
   - In AI mode, take turns with the AI opponent

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
