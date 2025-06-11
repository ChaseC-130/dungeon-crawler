# Dungeon Crawler - 2D Rogue-style Autobattler

A cooperative multiplayer autobattler game with dungeon-crawling elements, built with React Native, Phaser, and Node.js.

## Features
- Cooperative multiplayer (1-4 players)
- 10 progressively challenging floors
- Unit shop with drag-and-drop placement
- **NEW: Auto-battle combat system** with real-time unit movement and combat
- **NEW: AI enemy spawning** that counters player strategies
- **NEW: 60-second preparation timer** that auto-starts combat
- Upgrade system with reroll mechanics
- Cross-platform support (Web, iOS, Android, Desktop via Electron)

## Quick Start

### Easiest Way (Recommended)
1. Double-click `play-game.bat`
2. The game will automatically open in your browser at http://localhost:8080
3. That's it! No Expo setup required.

### Using Expo (Advanced)
1. **First time setup**: Run `npm install`
2. Run `npm run dev:web` 
3. If you see errors, the game includes a simpler standalone version (use play-game.bat instead)

### Manual Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the game server:
   ```bash
   npm run server
   ```

3. In a new terminal, start the web client:
   ```bash
   npm run web
   ```

4. Expo will open automatically. The web app runs at the URL shown in the terminal (typically http://localhost:19006)

## Available Scripts

- `npm run dev:web` - Start both server and web client concurrently
- `npm run server` - Start only the game server
- `npm run web` - Start Expo web development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web:build` - Build for web deployment

## Game Controls

### Unit Management
- **Drag units from shop** - Purchase and place units on the grid
- **Click unplaced units** - Select unit to place
- **Reroll shop** - Costs 10 gold (button in shop panel)
- **Sell units** - Right-click placed units (75% refund)

### Game Flow
1. **Lobby** - Find match or create private match with 1-4 players
2. **Starting Units** - Select 5 units at game start
3. **Preparation Phase** - Buy and place units on the grid (60-second timer)
4. **Ready Button** - Click when done, or wait for timer to auto-start combat
5. **Combat Phase** - Watch units auto-battle against AI enemies
6. **Victory/Defeat** - Progress to next floor or game over
7. **Upgrade Phase** - Choose upgrades after each floor (reroll available)

## Tech Stack

- **Frontend**: React Native + Expo
- **Game Engine**: Phaser 3
- **Backend**: Node.js + Socket.io
- **Platforms**: Web, iOS, Android, Desktop (Electron)

## Deployment

### Web Deployment
```bash
npm run web:build
# Deploy the web-build folder to your hosting service
```

### Desktop (Electron)
Coming soon - the app structure supports Electron wrapper

### Mobile (iOS/Android)
Use Expo build service:
```bash
expo build:ios
expo build:android
```

## Development Notes

- Unit sprites render with idle animations in shop cards
- Drag and drop from shop to grid for unit placement
- Reroll button only appears in shop and upgrade panels
- Game supports hot reloading for rapid development

## Troubleshooting

### Permission Issues (Windows)
- Run PowerShell as Administrator
- Delete node_modules and reinstall: `npm install`

### Port Conflicts
- Server runs on port 3001
- Web client runs on port 8081
- Kill processes using these ports if needed

### Expo Issues
- Try tunnel mode: `npx expo start --tunnel`
- Clear Expo cache: `expo start -c`

## License
ISC