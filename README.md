# Carrom React - TypeScript

A modern Carrom board game built with React and TypeScript, optimized for Farcaster mini-apps and responsive mobile devices.

## Features

- 🎮 Full Carrom game implementation with physics simulation
- ⚛️ Built with React 18 and TypeScript
- 📱 Fully responsive design for mobile and Farcaster mini-apps
- 🎯 Touch support for mobile devices
- 🎨 Modern UI with smooth animations
- 🔄 Turn-based gameplay with board rotation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
yarn install
# or
npm install
```

2. Start the development server:
```bash
yarn dev
# or
npm run dev
```

3. Build for production:
```bash
yarn build
# or
npm run build
```

## How to Play

1. Click "Start Game" to begin
2. Position the striker by moving your mouse/touch on the board
3. Click/tap to set the striker position
4. Move your mouse/touch to aim and release to strike
5. Try to pocket your pieces (black or white) and the queen
6. The game alternates turns between players

## Game Rules

- Each player takes turns striking
- Pocket your pieces (black or white) to score points
- Pocket the queen (red) to activate queen mode (+10 points)
- Pocketing the striker results in a foul (-2 points)
- The board rotates 180° when turns change

## Project Structure

```
src/
├── components/       # React components
│   ├── CarromBoard.tsx
│   ├── Game.tsx
│   └── Menu.tsx
├── game/            # Game logic classes
│   ├── Board.ts
│   ├── Gatti.ts
│   ├── Hole.ts
│   ├── Player.ts
│   └── Target.ts
├── types/           # TypeScript types
│   ├── Point.ts
│   └── Gatti.ts
└── utils/          # Utility functions
    └── Util.ts
```

## Farcaster Mini-App Optimization

The game is optimized for Farcaster mini-apps with:
- Responsive viewport sizing
- Touch-friendly controls
- Optimized canvas rendering
- Mobile-first CSS design

## Technologies Used

- React 18
- TypeScript
- Vite
- Canvas API for game rendering

## License

MIT

## Credits

Original game by Zafor Iqbal
Converted to React + TypeScript
# carrom-game-web
