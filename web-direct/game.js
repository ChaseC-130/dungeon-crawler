// Game state
let socket = null;
let gameState = null;
let player = null;
let phaserGame = null;
let mainScene = null;
let draggedUnitType = null;
let unitSpritesheets = {};

// Connect to server
function connectToServer() {
    socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
        console.log('Connected to server');
        document.getElementById('connection-status').className = 'connection-status connected';
        document.getElementById('connection-status').textContent = 'Connected';
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        document.getElementById('connection-status').className = 'connection-status disconnected';
        document.getElementById('connection-status').textContent = 'Disconnected';
    });
    
    socket.on('waiting-for-players', (data) => {
        document.getElementById('player-count').textContent = `${data.playersInQueue}/${data.maxPlayers} Players`;
    });
    
    socket.on('game-state', (state) => {
        gameState = state;
        updateGameState();
        
        // Update player list in waiting room
        if (state && state.players && document.getElementById('waiting').style.display !== 'none') {
            const playerList = document.getElementById('player-list');
            playerList.innerHTML = '';
            state.players.forEach(p => {
                const div = document.createElement('div');
                div.className = 'player-item';
                div.innerHTML = `<span>${p.name}</span><span>${p.isReady ? '✓ Ready' : 'Waiting...'}</span>`;
                playerList.appendChild(div);
            });
        }
    });
    
    socket.on('match-started', (matchId) => {
        console.log('Match started:', matchId);
        startGame();
    });
    
    socket.on('error', (message) => {
        alert('Error: ' + message);
    });
}

// UI Functions
function showNameInput() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('name-input').style.display = 'block';
}

function showMainMenu() {
    document.getElementById('name-input').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
}

function joinGame() {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (!socket || !socket.connected) {
        alert('Not connected to server');
        return;
    }
    
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    player = {
        id: playerId,
        name: playerName,
        gold: 50
    };
    
    socket.emit('join-match', playerId, playerName);
    
    document.getElementById('name-input').style.display = 'none';
    document.getElementById('waiting').style.display = 'block';
}

function leaveGame() {
    location.reload();
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('phaser-game').style.display = 'block';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('shop').style.display = 'block';
    
    initPhaser();
}

function updateGameState() {
    if (!gameState) return;
    
    // Update player data
    const currentPlayer = gameState.players.find(p => p.id === player.id);
    if (currentPlayer) {
        player = currentPlayer;
        document.getElementById('gold-amount').textContent = player.gold;
    }
    
    // Update phase info
    document.getElementById('phase-text').textContent = 
        gameState.phase === 'preparation' ? 'Preparation Phase' :
        gameState.phase === 'combat' ? 'Combat Phase' :
        gameState.phase === 'post-combat' ? 'Choose Upgrades' : 'Game Over';
    
    document.getElementById('floor').textContent = gameState.currentFloor;
    
    // Update ready button
    const readyBtn = document.getElementById('ready-btn');
    if (gameState.phase === 'preparation') {
        readyBtn.style.display = 'inline-block';
        readyBtn.textContent = player.isReady ? 'READY!' : 'READY';
        readyBtn.disabled = player.isReady;
    } else {
        readyBtn.style.display = 'none';
    }
    
    // Update shop
    if (gameState.phase === 'preparation') {
        updateShop();
        document.getElementById('shop').style.display = 'block';
    } else {
        document.getElementById('shop').style.display = 'none';
    }
    
    // Update Phaser game
    if (mainScene && mainScene.scene.isActive()) {
        mainScene.updateGameState(gameState);
    }
}

function updateShop() {
    const container = document.getElementById('unit-cards');
    container.innerHTML = '';
    
    gameState.shopUnits.forEach(unit => {
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.draggable = true;
        
        if (player.gold < unit.cost) {
            card.style.opacity = '0.6';
            card.draggable = false;
        }
        
        card.innerHTML = `
            <div class="unit-sprite" id="sprite-${unit.name}">
                <canvas width="64" height="64"></canvas>
            </div>
            <div class="unit-name">${unit.name}</div>
            <div class="unit-cost">💰 ${unit.cost}</div>
            <div class="unit-stats">
                <div class="stat"><span>⚔️ Damage</span><span>${unit.damage}</span></div>
                <div class="stat"><span>❤️ Health</span><span>${unit.health}</span></div>
                <div class="stat"><span>🏃 Speed</span><span>${unit.movementSpeed}</span></div>
                <div class="stat"><span>🛡️ Type</span><span>${unit.armorType}</span></div>
                ${unit.innatePassive ? `<div style="margin-top: 8px; font-style: italic; color: #4CAF50;">${unit.innatePassive}</div>` : ''}
            </div>
        `;
        
        // Set up drag events
        card.ondragstart = (e) => {
            if (player.gold >= unit.cost) {
                draggedUnitType = unit.name;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
                
                // Create visual feedback
                const dragImage = document.getElementById('dragging-unit');
                dragImage.innerHTML = `<div style="background: rgba(76, 175, 80, 0.8); padding: 10px; border-radius: 8px; color: white; font-weight: bold;">${unit.name}</div>`;
                e.dataTransfer.setDragImage(dragImage, 50, 50);
            }
        };
        
        card.ondragend = () => {
            card.classList.remove('dragging');
            draggedUnitType = null;
        };
        
        container.appendChild(card);
        
        // Draw unit sprite preview
        drawUnitSprite(unit.name);
    });
}

function drawUnitSprite(unitName) {
    setTimeout(() => {
        const canvas = document.querySelector(`#sprite-${unitName} canvas`);
        if (canvas && unitSpritesheets[unitName.toLowerCase()]) {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            const img = unitSpritesheets[unitName.toLowerCase()];
            if (img && img.complete) {
                // Draw first frame of sprite
                ctx.clearRect(0, 0, 64, 64);
                ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 64, 64);
            }
        }
    }, 100);
}

function setReady() {
    if (socket) {
        socket.emit('player-ready');
    }
}

function rerollShop() {
    if (socket && player && player.gold >= 10) {
        socket.emit('reroll-shop');
    }
}

// Phaser Game
function initPhaser() {
    const config = {
        type: Phaser.AUTO,
        parent: 'phaser-game',
        width: window.innerWidth,
        height: window.innerHeight - 140, // Account for HUD and shop
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        backgroundColor: '#1a1a2e'
    };
    
    phaserGame = new Phaser.Game(config);
}

function preload() {
    mainScene = this;
    
    // Load backgrounds
    this.load.setPath('/assets/');
    this.load.image('battle1', 'backgrounds/battle1.png');
    this.load.image('battle2', 'backgrounds/battle2.png');
    this.load.image('battle3', 'backgrounds/battle3.png');
    this.load.image('battle4', 'backgrounds/battle4.png');
    
    // Load unit spritesheets
    const units = ['knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard', 'gladiator'];
    units.forEach(unit => {
        this.load.atlas(unit, `units/${unit}/${unit}.png`, `units/${unit}/${unit}.json`);
        
        // Also load for sprite previews
        const img = new Image();
        img.src = `/assets/units/${unit}/${unit}.png`;
        unitSpritesheets[unit] = img;
    });
    
    // Load tiles for grid
    this.load.image('tile', 'tileset/tiles/Tile_25.png');
}

function create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Add background
    this.background = this.add.image(width/2, height/2, 'battle1');
    this.background.setDisplaySize(width, height);
    
    // Create grid
    this.gridContainer = this.add.container(width/2, height/2);
    this.grid = [];
    this.gridCells = [];
    const gridSize = 12;
    const cellSize = Math.min(width * 0.7 / gridSize, height * 0.8 / gridSize);
    this.cellSize = cellSize;
    this.gridSize = gridSize;
    
    const gridWidth = gridSize * cellSize;
    const gridHeight = gridSize * cellSize;
    
    // Grid background
    const gridBg = this.add.rectangle(0, 0, gridWidth + 20, gridHeight + 20, 0x0f3460, 0.8);
    gridBg.setStrokeStyle(4, 0x4CAF50, 1);
    this.gridContainer.add(gridBg);
    
    for (let y = 0; y < gridSize; y++) {
        this.gridCells[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const cellX = (x - gridSize/2 + 0.5) * cellSize;
            const cellY = (y - gridSize/2 + 0.5) * cellSize;
            
            const cell = this.add.image(cellX, cellY, 'tile');
            cell.setDisplaySize(cellSize - 2, cellSize - 2);
            cell.setAlpha(0.3);
            cell.setInteractive();
            
            // Store grid position
            cell.gridX = x;
            cell.gridY = y;
            
            this.gridContainer.add(cell);
            this.gridCells[y][x] = cell;
        }
    }
    
    // Highlight cell for placement
    this.highlightCell = this.add.rectangle(0, 0, cellSize - 2, cellSize - 2, 0x4CAF50, 0);
    this.highlightCell.setStrokeStyle(3, 0x4CAF50, 1);
    this.highlightCell.setVisible(false);
    this.gridContainer.add(this.highlightCell);
    
    // Units container
    this.units = new Map();
    this.unitsContainer = this.add.container(width/2, height/2);
    
    // Set up drag-and-drop for unit placement
    this.input.on('dragenter', (pointer, target) => {
        if (target.gridX !== undefined && draggedUnitType) {
            this.highlightCell.setPosition(
                (target.gridX - this.gridSize/2 + 0.5) * this.cellSize,
                (target.gridY - this.gridSize/2 + 0.5) * this.cellSize
            );
            this.highlightCell.setVisible(true);
            
            // Check if cell is occupied
            const occupied = gameState && gameState.grid[target.gridY][target.gridX].occupied;
            if (occupied) {
                this.highlightCell.setStrokeStyle(3, 0xFF0000, 1);
            } else {
                this.highlightCell.setStrokeStyle(3, 0x4CAF50, 1);
            }
        }
    });
    
    this.input.on('dragleave', () => {
        this.highlightCell.setVisible(false);
    });
    
    this.input.on('drop', (pointer, target) => {
        if (target.gridX !== undefined && draggedUnitType && gameState) {
            const occupied = gameState.grid[target.gridY][target.gridX].occupied;
            if (!occupied) {
                // Purchase and place unit
                socket.emit('purchase-unit', draggedUnitType);
                
                // Wait a bit for the server to process, then place
                setTimeout(() => {
                    if (player && player.units.length > 0) {
                        const newUnit = player.units[player.units.length - 1];
                        socket.emit('place-unit', newUnit.id, { x: target.gridX, y: target.gridY });
                    }
                }, 100);
            }
        }
        this.highlightCell.setVisible(false);
    });
    
    // Enable drop on all grid cells
    this.gridCells.forEach(row => {
        row.forEach(cell => {
            cell.setInteractive({ dropZone: true });
        });
    });
    
    // Handle window resize
    this.scale.on('resize', (gameSize) => {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.background.setPosition(width/2, height/2);
        this.background.setDisplaySize(width, height);
        
        this.gridContainer.setPosition(width/2, height/2);
        this.unitsContainer.setPosition(width/2, height/2);
    });
    
    // Set up animations
    this.createAnimations();
}

function createAnimations() {
    const units = ['knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard', 'gladiator'];
    
    units.forEach(unit => {
        if (this.textures.exists(unit)) {
            const frames = this.textures.get(unit).getFrameNames();
            
            // Create idle animation
            const idleFrames = frames.filter(f => f.toLowerCase().includes('idle'));
            if (idleFrames.length > 0) {
                this.anims.create({
                    key: `${unit}_idle`,
                    frames: this.anims.generateFrameNames(unit, { frames: idleFrames }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            
            // Create walk animation
            const walkFrames = frames.filter(f => f.toLowerCase().includes('walk') || f.toLowerCase().includes('run'));
            if (walkFrames.length > 0) {
                this.anims.create({
                    key: `${unit}_walk`,
                    frames: this.anims.generateFrameNames(unit, { frames: walkFrames }),
                    frameRate: 10,
                    repeat: -1
                });
            }
            
            // Create attack animation
            const attackFrames = frames.filter(f => f.toLowerCase().includes('attack'));
            if (attackFrames.length > 0) {
                this.anims.create({
                    key: `${unit}_attack`,
                    frames: this.anims.generateFrameNames(unit, { frames: attackFrames }),
                    frameRate: 12,
                    repeat: -1
                });
            }
        }
    });
}

function update() {
    // Update is handled by updateGameState
}

// Add updateGameState method to Phaser scene
Phaser.Scene.prototype.updateGameState = function(state) {
    if (!state) return;
    
    // Update background based on floor
    const floor = state.currentFloor;
    let bgKey = 'battle1';
    if (floor <= 3) bgKey = 'battle1';
    else if (floor <= 6) bgKey = 'battle2';
    else if (floor <= 8) bgKey = 'battle3';
    else bgKey = 'battle4';
    
    if (this.background.texture.key !== bgKey) {
        this.background.setTexture(bgKey);
    }
    
    // Update units
    const allUnits = [
        ...state.players.flatMap(p => p.units),
        ...state.enemyUnits
    ];
    
    // Remove units that no longer exist
    for (const [id, sprite] of this.units) {
        if (!allUnits.find(u => u.id === id)) {
            sprite.destroy();
            this.units.delete(id);
        }
    }
    
    // Update or create sprites
    allUnits.forEach(unit => {
        let sprite = this.units.get(unit.id);
        
        if (!sprite && unit.position) {
            // Create new unit sprite
            const unitType = unit.name.toLowerCase();
            sprite = this.add.sprite(0, 0, unitType);
            
            // Set scale and tint
            sprite.setScale(this.cellSize / 100);
            if (unit.id.startsWith('enemy-')) {
                sprite.setTint(0xff6666);
            }
            
            // Add health bar
            const healthBarBg = this.add.rectangle(0, -40, 50, 6, 0x000000);
            healthBarBg.setStrokeStyle(1, 0x333333);
            const healthBar = this.add.rectangle(0, -40, 50, 6, 0x4CAF50);
            
            sprite.healthBarBg = healthBarBg;
            sprite.healthBar = healthBar;
            sprite.unitId = unit.id;
            sprite.unitData = unit;
            
            // Create container for unit and health bars
            const container = this.add.container(0, 0, [sprite, healthBarBg, healthBar]);
            container.unitId = unit.id;
            
            this.unitsContainer.add(container);
            this.units.set(unit.id, container);
            
            // Play idle animation
            if (this.anims.exists(`${unitType}_idle`)) {
                sprite.play(`${unitType}_idle`);
            }
        }
        
        if (sprite && unit.position) {
            // Update position
            const targetX = (unit.position.x - this.gridSize/2 + 0.5) * this.cellSize;
            const targetY = (unit.position.y - this.gridSize/2 + 0.5) * this.cellSize;
            
            if (state.phase === 'combat') {
                // Smooth movement during combat
                sprite.x += (targetX - sprite.x) * 0.1;
                sprite.y += (targetY - sprite.y) * 0.1;
            } else {
                sprite.x = targetX;
                sprite.y = targetY;
            }
            
            // Update health bar
            const healthPercent = unit.health / unit.maxHealth;
            sprite.healthBar.displayWidth = 50 * healthPercent;
            
            // Change color based on health
            if (healthPercent < 0.3) {
                sprite.healthBar.setFillStyle(0xff0000);
            } else if (healthPercent < 0.6) {
                sprite.healthBar.setFillStyle(0xffaa00);
            } else {
                sprite.healthBar.setFillStyle(0x00ff00);
            }
            
            // Update animation based on status
            const unitSprite = sprite.list[0];
            const unitType = unit.name.toLowerCase();
            
            if (unit.status === 'attacking' && this.anims.exists(`${unitType}_attack`)) {
                if (unitSprite.anims.currentAnim?.key !== `${unitType}_attack`) {
                    unitSprite.play(`${unitType}_attack`);
                }
            } else if (unit.status === 'moving' && this.anims.exists(`${unitType}_walk`)) {
                if (unitSprite.anims.currentAnim?.key !== `${unitType}_walk`) {
                    unitSprite.play(`${unitType}_walk`);
                }
            } else if (unit.status === 'idle' && this.anims.exists(`${unitType}_idle`)) {
                if (unitSprite.anims.currentAnim?.key !== `${unitType}_idle`) {
                    unitSprite.play(`${unitType}_idle`);
                }
            }
            
            // Update visibility for dead units
            if (unit.status === 'dead') {
                sprite.alpha = 0.3;
            }
            
            // Update depth based on Y position
            sprite.setDepth(unit.position.y);
        }
    });
};

// Initialize connection when page loads
window.onload = function() {
    connectToServer();
};