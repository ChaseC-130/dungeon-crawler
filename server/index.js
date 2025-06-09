require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const GameManager = require('./src/GameManager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const gameManager = new GameManager(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', matches: gameManager.getActiveMatchCount() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // New lobby events
  socket.on('findMatch', (data) => {
    console.log('Player looking for match:', data);
    const playerId = socket.id; // Use socket ID as player ID for simplicity
    const playerName = data.playerName || `Player${Math.floor(Math.random() * 1000)}`;
    gameManager.handleFindMatch(socket, playerId, playerName);
  });
  
  socket.on('createPrivateMatch', (data) => {
    console.log('Creating private match:', data);
    const playerId = socket.id;
    const playerName = data.playerName || `Host${Math.floor(Math.random() * 1000)}`;
    gameManager.handleCreatePrivateMatch(socket, playerId, playerName);
  });
  
  socket.on('setLobbyReady', () => {
    console.log('Player set lobby ready:', socket.id);
    gameManager.handleLobbyReady(socket);
  });
  
  socket.on('selectStartingUnits', (units) => {
    console.log('Player selected starting units:', units);
    gameManager.handleSelectStartingUnits(socket, units);
  });
  
  socket.on('setReady', () => {
    console.log('Player ready:', socket.id);
    gameManager.handlePlayerReady(socket);
  });
  
  // Legacy events
  socket.on('join-match', (playerId, playerName) => {
    gameManager.handleJoinMatch(socket, playerId, playerName);
  });
  
  socket.on('place-unit', (unitId, position) => {
    gameManager.handlePlaceUnit(socket, unitId, position);
  });
  
  socket.on('moveUnit', (unitId, position) => {
    gameManager.handleMoveUnit(socket, unitId, position);
  });
  
  socket.on('purchase-unit', (unitType) => {
    gameManager.handlePurchaseUnit(socket, unitType);
  });
  
  socket.on('purchaseAndPlaceUnit', (data) => {
    gameManager.handlePurchaseAndPlaceUnit(socket, data.unitType, data.position);
  });
  
  socket.on('sell-unit', (unitId) => {
    gameManager.handleSellUnit(socket, unitId);
  });
  
  socket.on('sellUnit', (unitId) => {
    gameManager.handleSellUnit(socket, unitId);
  });
  
  socket.on('reroll-shop', () => {
    gameManager.handleRerollShop(socket);
  });
  
  socket.on('rerollShop', () => {
    gameManager.handleRerollShop(socket);
  });
  
  socket.on('select-upgrade', (upgradeId, targetUnitType) => {
    gameManager.handleSelectUpgrade(socket, upgradeId, targetUnitType);
  });
  
  socket.on('selectUpgrade', (upgradeId, targetUnitType) => {
    gameManager.handleSelectUpgrade(socket, upgradeId, targetUnitType);
  });
  
  socket.on('rerollUpgrades', () => {
    gameManager.handleRerollUpgrades(socket);
  });
  
  socket.on('player-ready', () => {
    gameManager.handlePlayerReady(socket);
  });

  socket.on('cell-hover', (position) => {
    gameManager.handleCellHover(socket, position);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});