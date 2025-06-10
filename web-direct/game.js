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
                div.innerHTML = `<span style="color: ${p.color || '#FFF'}">${p.name}</span><span>${p.isReady ? '✓ Ready' : 'Waiting...'}</span>`;
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
    
    socket.on('player-hover', (playerId, playerName, position, playerColor) => {
        // Update other players' hover positions in Phaser scene
        if (mainScene && mainScene.scene.isActive() && player && playerId !== player.id) {
            mainScene.updatePlayerHover(playerId, playerName, position, playerColor);
        }
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
        
        // Update player name display with color
        const playerNameElement = document.getElementById('player-name-display');
        if (playerNameElement) {
            playerNameElement.textContent = player.name;
            playerNameElement.style.color = player.color || '#FFF';
        }
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
    setTimeout(async () => {
        const canvas = document.querySelector(`#sprite-${unitName} canvas`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        try {
            // Load both image and JSON data
            const [imgResponse, jsonResponse] = await Promise.all([
                fetch(`/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.png`),
                fetch(`/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.json`)
            ]);
            
            if (!imgResponse.ok || !jsonResponse.ok) {
                console.error('Failed to load sprite assets for:', unitName);
                return;
            }
            
            const jsonData = await jsonResponse.json();
            const imgBlob = await imgResponse.blob();
            const imgUrl = URL.createObjectURL(imgBlob);
            
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, 64, 64);
                
                // Find the first idle frame
                let frameData = null;
                if (jsonData.textures && jsonData.textures[0] && jsonData.textures[0].frames) {
                    const frames = jsonData.textures[0].frames;
                    const idleFrames = frames.filter(f => f.filename.toLowerCase().includes('idle'));
                    if (idleFrames.length > 0) {
                        idleFrames.sort((a, b) => a.filename.localeCompare(b.filename));
                        frameData = idleFrames[0];
                    } else {
                        frameData = frames[0];
                    }
                }
                
                if (frameData && frameData.frame) {
                    // Calculate scaling to fit in 64x64 canvas
                    const frameWidth = frameData.frame.w;
                    const frameHeight = frameData.frame.h;
                    const scale = Math.min(64 / frameWidth, 64 / frameHeight) * 0.8;
                    
                    const destWidth = frameWidth * scale;
                    const destHeight = frameHeight * scale;
                    const destX = (64 - destWidth) / 2;
                    const destY = (64 - destHeight) / 2;
                    
                    // Draw the specific frame from the spritesheet
                    ctx.drawImage(
                        img,
                        frameData.frame.x, frameData.frame.y, 
                        frameData.frame.w, frameData.frame.h,
                        destX, destY, 
                        destWidth, destHeight
                    );
                } else {
                    // Fallback: draw scaled version of entire image
                    const scale = Math.min(64 / img.width, 64 / img.height) * 0.8;
                    const destWidth = img.width * scale;
                    const destHeight = img.height * scale;
                    const destX = (64 - destWidth) / 2;
                    const destY = (64 - destHeight) / 2;
                    ctx.drawImage(img, destX, destY, destWidth, destHeight);
                }
                
                URL.revokeObjectURL(imgUrl);
            };
            img.src = imgUrl;
        } catch (error) {
            console.error('Error loading sprite:', error);
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
    
    // Highlight cell for placement - DISABLED to remove green debug boxes
    this.highlightCell = this.add.rectangle(0, 0, cellSize - 2, cellSize - 2, 0x4CAF50, 0);
    this.highlightCell.setStrokeStyle(3, 0x4CAF50, 0); // Set alpha to 0 to hide stroke
    this.highlightCell.setVisible(false);
    this.gridContainer.add(this.highlightCell);
    
    // Units container
    this.units = new Map();
    this.unitsContainer = this.add.container(width/2, height/2);
    
    // Set up drag-and-drop for unit placement
    this.input.on('dragenter', (pointer, target) => {
        if (target.gridX !== undefined && draggedUnitType) {
            // DISABLED: Remove green debug box highlighting during purchasing
            // this.highlightCell.setPosition(
            //     (target.gridX - this.gridSize/2 + 0.5) * this.cellSize,
            //     (target.gridY - this.gridSize/2 + 0.5) * this.cellSize
            // );
            // this.highlightCell.setVisible(true);
            
            // Check if cell is occupied
            const occupied = gameState && gameState.grid[target.gridY][target.gridX].occupied;
            // DISABLED: Remove all highlighting
            // if (occupied) {
            //     this.highlightCell.setStrokeStyle(3, 0xFF0000, 1);
            // } else {
            //     this.highlightCell.setStrokeStyle(3, 0x4CAF50, 1);
            // }
        }
    });
    
    this.input.on('dragleave', () => {
        // DISABLED: Keep highlight hidden
        // this.highlightCell.setVisible(false);
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
        // DISABLED: Keep highlight hidden
        // this.highlightCell.setVisible(false);
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
    
    // Track mouse movement for hover effects
    this.input.on('pointermove', (pointer) => {
        if (gameState && gameState.phase === 'preparation' && player) {
            // Convert pointer position to grid coordinates
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const gridX = Math.floor((worldPoint.x - this.gridContainer.x + this.gridSize * this.cellSize / 2) / this.cellSize);
            const gridY = Math.floor((worldPoint.y - this.gridContainer.y + this.gridSize * this.cellSize / 2) / this.cellSize);
            
            // Only send if within grid bounds
            if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
                this.sendHoverPosition(gridX, gridY);
            }
        }
    });
    
    // Player hover storage
    this.playerHovers = new Map();
    
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
    
    // Update background based on phase and floor
    const floor = state.currentFloor;
    let bgKey = 'battle1';
    
    // During preparation phase, use preparation background style
    if (state.phase === 'preparation') {
        bgKey = 'battle1'; // Use battle1 but will add overlay
    } else {
        // During combat, use floor-based backgrounds
        if (floor <= 3) bgKey = 'battle1';
        else if (floor <= 6) bgKey = 'battle2';
        else if (floor <= 8) bgKey = 'battle3';
        else bgKey = 'battle4';
    }
    
    if (this.background.texture.key !== bgKey) {
        this.background.setTexture(bgKey);
    }
    
    // Handle phase overlay
    if (state.phase === 'preparation') {
        // Add blue tint overlay for preparation phase
        if (!this.phaseOverlay) {
            this.phaseOverlay = this.add.rectangle(
                this.scale.width/2, this.scale.height/2,
                this.scale.width, this.scale.height,
                0x1a1a2e, 0.6
            );
            this.phaseOverlay.setDepth(-90);
        }
        this.phaseOverlay.setVisible(true);
    } else {
        // Remove overlay during combat
        if (this.phaseOverlay) {
            this.phaseOverlay.setVisible(false);
        }
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
            
            // Make unit interactive and draggable (only for player's own units)
            if (!unit.id.startsWith('enemy-') && state.phase === 'preparation') {
                const currentPlayer = state.players.find(p => p.id === player.id);
                const isPlayerUnit = currentPlayer && currentPlayer.units.some(u => u.id === unit.id);
                
                if (isPlayerUnit) {
                    sprite.setInteractive();
                    this.input.setDraggable(sprite);
                    
                    sprite.on('dragstart', () => {
                        sprite.setScale(sprite.scaleX * 1.1);
                        sprite.setAlpha(0.8);
                        sprite.setDepth(1000);
                    });
                    
                    sprite.on('drag', (pointer, dragX, dragY) => {
                        sprite.x = dragX;
                        sprite.y = dragY;
                        sprite.healthBarBg.x = dragX;
                        sprite.healthBarBg.y = dragY - 40;
                        sprite.healthBar.x = dragX;
                        sprite.healthBar.y = dragY - 40;
                        
                        // Highlight grid cell under pointer
                        const gridX = Math.floor((dragX - this.gridContainer.x + this.gridSize * this.cellSize / 2) / this.cellSize);
                        const gridY = Math.floor((dragY - this.gridContainer.y + this.gridSize * this.cellSize / 2) / this.cellSize);
                        
                        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
                            const cellX = (gridX - this.gridSize/2 + 0.5) * this.cellSize;
                            const cellY = (gridY - this.gridSize/2 + 0.5) * this.cellSize;
                            
                            // DISABLED: Remove green debug box highlighting during unit dragging
                            // this.highlightCell.setPosition(cellX, cellY);
                            // this.highlightCell.setVisible(true);
                            
                            // Check if cell is valid for placement
                            const occupied = state.grid[gridY][gridX].occupied;
                            const isCurrentPosition = unit.position && unit.position.x === gridX && unit.position.y === gridY;
                            
                            // DISABLED: Remove all stroke highlighting
                            // if (occupied && !isCurrentPosition) {
                            //     this.highlightCell.setStrokeStyle(3, 0xFF0000, 1);
                            // } else {
                            //     this.highlightCell.setStrokeStyle(3, 0x4CAF50, 1);
                            // }
                        }
                    });
                    
                    sprite.on('dragend', (pointer) => {
                        // DISABLED: Keep highlight hidden
                        // this.highlightCell.setVisible(false);
                        
                        // Convert drop position to grid coordinates
                        const gridX = Math.floor((sprite.x - this.gridContainer.x + this.gridSize * this.cellSize / 2) / this.cellSize);
                        const gridY = Math.floor((sprite.y - this.gridContainer.y + this.gridSize * this.cellSize / 2) / this.cellSize);
                        
                        // Check if valid placement
                        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
                            const occupied = state.grid[gridY][gridX].occupied;
                            const isCurrentPosition = unit.position && unit.position.x === gridX && unit.position.y === gridY;
                            const positionChanged = !unit.position || unit.position.x !== gridX || unit.position.y !== gridY;
                            
                            if ((!occupied || isCurrentPosition) && positionChanged) {
                                // Valid drop - emit place unit event
                                socket.emit('place-unit', unit.id, { x: gridX, y: gridY });
                            }
                        }
                        
                        // Reset sprite appearance
                        sprite.setScale(this.cellSize / 100);
                        sprite.setAlpha(1);
                        sprite.setDepth(unit.position ? unit.position.y : 0);
                        
                        // Snap back to grid position
                        if (unit.position) {
                            const cellX = (unit.position.x - this.gridSize/2 + 0.5) * this.cellSize;
                            const cellY = (unit.position.y - this.gridSize/2 + 0.5) * this.cellSize;
                            sprite.x = cellX;
                            sprite.y = cellY;
                            sprite.healthBarBg.x = cellX;
                            sprite.healthBarBg.y = cellY - 40;
                            sprite.healthBar.x = cellX;
                            sprite.healthBar.y = cellY - 40;
                        }
                    });
                }
            }
            
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

// Add hover methods to Phaser scene
Phaser.Scene.prototype.sendHoverPosition = function(gridX, gridY) {
    // Debounce hover sending
    if (!this.lastHoverTime || Date.now() - this.lastHoverTime > 100) {
        this.lastHoverTime = Date.now();
        if (socket && socket.connected) {
            socket.emit('cell-hover', { x: gridX, y: gridY });
        }
    }
}

Phaser.Scene.prototype.updatePlayerHover = function(playerId, playerName, position, playerColor) {
    // Remove existing hover for this player
    if (this.playerHovers.has(playerId)) {
        const existingHover = this.playerHovers.get(playerId);
        existingHover.destroy();
        this.playerHovers.delete(playerId);
    }
    
    // If position is null, just clear the hover
    if (!position) return;
    
    // Validate position
    if (position.x < 0 || position.x >= this.gridSize || position.y < 0 || position.y >= this.gridSize) {
        return;
    }
    
    // Convert player color from hex string to number
    let color = 0x888888; // Default gray
    try {
        if (playerColor && playerColor.startsWith('#')) {
            color = parseInt(playerColor.slice(1), 16);
        }
    } catch (e) {
        console.warn('Invalid player color:', playerColor);
    }
    
    // Create hover rectangle
    const cellX = (position.x - this.gridSize/2 + 0.5) * this.cellSize;
    const cellY = (position.y - this.gridSize/2 + 0.5) * this.cellSize;
    
    const hoverRect = this.add.rectangle(
        cellX, cellY,
        this.cellSize - 2, this.cellSize - 2,
        color, 0
    );
    hoverRect.setStrokeStyle(2, color, 0.8);
    
    // Add player name text
    const nameText = this.add.text(cellX, cellY - this.cellSize/2 - 10, playerName, {
        fontSize: '10px',
        color: playerColor || '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 1
    });
    nameText.setOrigin(0.5);
    
    // Store both rect and text in a container
    const container = this.add.container(0, 0, [hoverRect, nameText]);
    this.gridContainer.add(container);
    
    // Store reference
    this.playerHovers.set(playerId, container);
}

// Initialize connection when page loads
window.onload = function() {
    connectToServer();
};