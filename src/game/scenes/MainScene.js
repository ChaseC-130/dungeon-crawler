"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Phaser = __importStar(require("phaser"));
var Grid_1 = __importDefault(require("../objects/Grid"));
var UnitSprite_1 = __importDefault(require("../objects/UnitSprite"));
var Projectile_1 = require("../objects/Projectile");
var UnitTooltip_1 = __importDefault(require("../objects/UnitTooltip"));
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene() {
        var _this = _super.call(this, { key: 'MainScene' }) || this;
        _this.unitSprites = new Map();
        _this.gameState = null;
        _this.backgroundMusic = null;
        _this.selectedUnit = null;
        _this.isDragging = false;
        _this.placementMode = false;
        _this.placementUnit = null;
        _this.placedUnit = null;
        _this.projectiles = [];
        _this.lastAttackTime = new Map();
        _this.tooltip = null;
        _this.currentPlayerId = null;
        _this.dragPreview = null; // For placement mode (purchase panel)
        _this.unitDragPreview = null; // For unit repositioning (cell-to-cell)
        _this.sellZone = null;
        _this.isOverSellZone = false;
        _this.draggedUnit = null;
        _this.dragInstruction = null;
        _this.originalDragPosition = null;
        _this.dragShadow = null;
        _this.cellSize = 0;
        _this.lastHoverPosition = null;
        _this.hoverDebounceTime = 100; // 100ms debounce
        _this.lastHoverSentTime = 0;
        return _this;
    }
    MainScene.prototype.create = function () {
        var _this = this;
        console.log('=== MAINSCENE CREATE CALLED ===');
        console.log('🚀 DRAG FIX VERSION 2.0 LOADED!');
        console.log('Scene object:', this);
        console.log('Scene cameras:', this.cameras);
        console.log('Scene add:', this.add);
        console.log('=== SCENE CREATE DEBUG ===');
        console.log('Scene dimensions:', {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            centerX: this.cameras.main.centerX,
            centerY: this.cameras.main.centerY
        });
        // Debug wizard texture loading
        console.log('🧙 Checking wizard texture at scene create...');
        if (this.textures.exists('wizard')) {
            var wizardTexture = this.textures.get('wizard');
            var frameNames = wizardTexture.getFrameNames();
            console.log("\uD83E\uDDD9 Wizard texture loaded with ".concat(frameNames.length, " frames"));
            var chargeFrames = frameNames.filter(function (f) { return f.includes('Charge_1_'); });
            console.log("\uD83E\uDDD9 Found ".concat(chargeFrames.length, " Charge_1_X frames:"), chargeFrames.slice(0, 5));
            // Test rendering a Charge frame
            if (chargeFrames.length > 0) {
                var testSprite_1 = this.add.sprite(100, 100, 'wizard', chargeFrames[0]);
                testSprite_1.setScale(3);
                testSprite_1.setDepth(10000);
                console.log("\uD83E\uDDD9 Test sprite created with frame: ".concat(chargeFrames[0]));
                // Remove after 5 seconds
                this.time.delayedCall(5000, function () { return testSprite_1.destroy(); });
            }
        }
        else {
            console.error("\u274C Wizard texture not loaded!");
        }
        // Initialize all state variables to prevent random highlighting
        this.isDragging = false;
        this.placementMode = false;
        this.placementUnit = null;
        this.placedUnit = null;
        this.selectedUnit = null;
        this.dragPreview = null;
        // Set background based on floor
        this.updateBackground();
        // Create grid - 20 columns x 8 rows
        this.createGrid();
        // Ensure highlight starts cleared and placement mode is disabled
        this.grid.clearHighlight();
        this.grid.clearAllPlayerHovers();
        this.placementMode = false;
        this.placementUnit = null;
        this.placedUnit = null;
        this.isDragging = false;
        this.selectedUnit = null;
        // Create tooltip
        this.tooltip = new UnitTooltip_1.default(this);
        // Get current player ID from the game context
        if (window.gameContext) {
            var player = window.gameContext.player;
            if (player) {
                this.currentPlayerId = player.id;
            }
        }
        // Expose test functions for debugging  
        window.testWizardAttack = function () { return _this.testWizardAttack(); };
        window.addTestWizard = function () { return _this.addTestWizard(); };
        window.testResponsive = function () { return _this.testResponsiveBehavior(); };
        // Log that functions are available
        console.log('🎮 MainScene debug functions available:');
        console.log('  - window.testResponsive() : Test responsive grid behavior');
        console.log('  - window.testWizardAttack() : Test wizard attack');
        console.log('  - window.addTestWizard() : Add test wizard');
        // Listen for ranged unit attacks from UnitSprites
        this.events.on('rangedUnitAttack', this.handleRangedUnitAttack.bind(this));
        // Log initial responsive state
        console.log('🎮 Initial screen state:', {
            screenSize: { width: this.cameras.main.width, height: this.cameras.main.height },
            gridCellSize: this.cellSize,
            gridPosition: { x: this.grid.x, y: this.grid.y }
        });
        // Setup input
        this.setupInput();
        // Listen for resize events
        this.scale.on('resize', this.onResize, this);
        // Start background music
        this.playBackgroundMusic();
    };
    MainScene.prototype.setupInput = function () {
        var _a;
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('pointercancel', this.cancelDrag, this);
        // Add keyboard support for canceling drag
        (_a = this.input.keyboard) === null || _a === void 0 ? void 0 : _a.on('keydown-ESC', this.cancelDrag, this);
    };
    MainScene.prototype.createGrid = function () {
        var gridWidth = 20;
        var gridHeight = 8;
        console.log('=== GRID CREATION DEBUG ===');
        console.log('Camera dimensions:', {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            ratio: this.cameras.main.width / this.cameras.main.height
        });
        console.log('Game config dimensions:', {
            width: this.game.config.width,
            height: this.game.config.height
        });
        console.log('Canvas element:', this.game.canvas);
        console.log('Canvas computed style:', this.game.canvas ? window.getComputedStyle(this.game.canvas) : 'No canvas');
        // Calculate cell size to fit the grid nicely within the camera
        // Be more aggressive with space usage on small screens
        var screenWidth = this.cameras.main.width;
        var screenHeight = this.cameras.main.height;
        // Use a much more aggressive approach to utilize screen space
        // The HUD is responsive and doesn't need as much reserved space
        var topHUDHeight = 60; // Reduced - HUD is compact
        var bottomHUDHeight = 120; // Reduced - shop panel is responsive
        // Minimal safety margins
        var horizontalMargin = 10; // Very small side margins
        var verticalMargin = 10; // Small top/bottom margins
        // Calculate available space - use as much as possible
        var availableWidth = screenWidth - (horizontalMargin * 2);
        var availableHeight = screenHeight - topHUDHeight - bottomHUDHeight - (verticalMargin * 2);
        // Calculate cell size based on available space
        var cellSizeByWidth = availableWidth / gridWidth;
        var cellSizeByHeight = availableHeight / gridHeight;
        var cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
        // Adjust min/max for better screen utilization
        var minCellSize = 20; // Slightly larger minimum for better visibility
        var maxCellSize = 80; // Increased max for large screens
        cellSize = Math.max(minCellSize, Math.min(maxCellSize, cellSize));
        this.cellSize = cellSize; // Store cell size for resize handling
        console.log('Cell size constraints applied:', {
            calculated: Math.min(cellSizeByWidth, cellSizeByHeight),
            final: cellSize,
            screenSize: { width: this.cameras.main.width, height: this.cameras.main.height }
        });
        console.log('Grid sizing calculation:');
        console.log('Cell size:', cellSize);
        console.log('Grid dimensions:', {
            pixelWidth: cellSize * gridWidth,
            pixelHeight: cellSize * gridHeight
        });
        // Position grid optimally for the available space
        var gridPixelHeight = cellSize * gridHeight;
        // Calculate proper grid center position
        // Center the grid in the available space between HUDs
        var gridCenterY = topHUDHeight + verticalMargin + (availableHeight / 2);
        console.log('Grid positioning calculation:', {
            screenHeight: screenHeight,
            totalUIHeight: totalUIHeight,
            availableHeight: availableHeight,
            gridPixelHeight: gridPixelHeight,
            gridCenterY: gridCenterY
        });
        this.grid = new Grid_1.default(this, this.cameras.main.centerX, gridCenterY, gridWidth, gridHeight, cellSize);
        // Set grid depth to ensure it renders above background but below UI
        this.grid.setDepth(1);
        console.log('Grid created at position:', {
            x: this.cameras.main.centerX,
            y: gridCenterY
        });
    };
    MainScene.prototype.onResize = function (gameSize) {
        var width = gameSize.width;
        var height = gameSize.height;
        this.cameras.resize(width, height);
        // Immediately update background to prevent any visual gaps
        this.updateBackground();
        // Update grid background size instead of recreating
        if (this.grid) {
            this.grid.updateBackgroundSize();
            // Optionally recreate grid if cells need resizing
            var gridWidth = 20;
            var gridHeight = 8;
            // Apply same responsive logic as createGrid
            var topHUDHeight = 60;
            var bottomHUDHeight = 120;
            var horizontalMargin = 10;
            var verticalMargin = 10;
            var availableWidth = width - (horizontalMargin * 2);
            var availableHeight = height - topHUDHeight - bottomHUDHeight - (verticalMargin * 2);
            var cellSizeByWidth = availableWidth / gridWidth;
            var cellSizeByHeight = availableHeight / gridHeight;
            var newCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
            // Apply same constraints as in createGrid
            var minCellSize = 20;
            var maxCellSize = 80;
            newCellSize = Math.max(minCellSize, Math.min(maxCellSize, newCellSize));
            // Get current cell size (approximation based on grid dimensions)
            var currentCellSize = this.cellSize;
            // Only recreate if cell size changed significantly
            if (!currentCellSize || Math.abs(newCellSize - currentCellSize) > 5) {
                var currentGridState = this.gameState ? this.gameState.grid : null;
                this.cellSize = newCellSize; // Update stored cell size
                this.grid.destroy();
                this.createGrid();
                // Restore grid state
                if (currentGridState) {
                    this.grid.updateGrid(currentGridState);
                    this.updateUnits();
                }
            }
        }
    };
    MainScene.prototype.onPointerDown = function (pointer) {
        var _this = this;
        if (!this.gameState)
            return;
        // Check for right-click to cancel drag
        if (pointer.rightButtonDown() && this.isDragging) {
            this.cancelDrag();
            return;
        }
        var worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // Handle placement mode
        if (this.placementMode && this.gameState.phase === 'preparation') {
            var gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
            if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
                if (this.placedUnit) {
                    // Place an already purchased unit
                    this.events.emit('place-unit', this.placedUnit.id, gridPos);
                }
                else if (this.placementUnit) {
                    // Purchase and place a new unit
                    // First purchase the unit
                    if (window.purchaseUnit) {
                        window.purchaseUnit(this.placementUnit.name);
                    }
                    // The server will respond with the purchased unit, which will trigger placement
                    // Store the position for when the unit is purchased
                    window.pendingPlacement = gridPos;
                }
                this.exitPlacementMode();
                // Play purchase sound
                if (this.sound.get('purchase')) {
                    this.sound.play('purchase', { volume: 0.5 });
                }
            }
            return;
        }
        // Check if clicking on a unit using Phaser's built-in system
        var clickedUnit = null;
        var clickedSprite = null;
        // Get all interactive objects under the pointer
        var hitObjects = this.input.hitTestPointer(pointer);
        var _loop_1 = function (id, sprite) {
            if (sprite && sprite.active && !sprite.getData('destroying')) {
                var bounds = sprite.getBounds();
                if (bounds.contains(worldPoint.x, worldPoint.y)) {
                    clickedSprite = sprite;
                    clickedUnit = this_1.gameState.players
                        .flatMap(function (p) { return p.units; })
                        .find(function (u) { return u.id === sprite.unitId; }) ||
                        this_1.gameState.enemyUnits.find(function (u) { return u.id === sprite.unitId; }) || null;
                    console.log("Clicked on unit via bounds check: ".concat(sprite.unitId));
                    return "break";
                }
            }
        };
        var this_1 = this;
        // Also check unit sprites directly
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            var state_1 = _loop_1(id, sprite);
            if (state_1 === "break")
                break;
        }
        // Fallback to hit test if bounds check didn't find anything
        if (!clickedSprite) {
            var _loop_2 = function (obj) {
                // Check if this is a UnitSprite instance
                if (obj instanceof UnitSprite_1.default) {
                    var unitSprite_1 = obj;
                    // Find the unit data for this sprite
                    clickedUnit = this_2.gameState.players
                        .flatMap(function (p) { return p.units; })
                        .find(function (u) { return u.id === unitSprite_1.unitId; }) ||
                        this_2.gameState.enemyUnits.find(function (u) { return u.id === unitSprite_1.unitId; }) || null;
                    clickedSprite = unitSprite_1;
                    console.log("Clicked on unit via instanceof: ".concat(unitSprite_1.unitId));
                    return "break";
                }
            };
            var this_2 = this;
            for (var _c = 0, hitObjects_1 = hitObjects; _c < hitObjects_1.length; _c++) {
                var obj = hitObjects_1[_c];
                var state_2 = _loop_2(obj);
                if (state_2 === "break")
                    break;
            }
        }
        if (clickedUnit) {
            // Show tooltip on click
            if (this.tooltip && clickedUnit.position) {
                var owner = this.gameState.players.find(function (p) {
                    return p.units.some(function (u) { return u.id === clickedUnit.id; });
                });
                var ownerName = owner ? owner.name : 'Enemy';
                // Position tooltip at the unit's grid cell center, not mouse cursor
                var unitWorldPos = this.grid.gridToWorld(clickedUnit.position.x, clickedUnit.position.y);
                this.tooltip.showForUnit(clickedUnit, ownerName, unitWorldPos.x, unitWorldPos.y);
                // Hide tooltip after 3 seconds
                this.time.delayedCall(3000, function () {
                    // Check if scene is still active before accessing tooltip
                    if (_this.scene && _this.tooltip) {
                        _this.tooltip.hide();
                    }
                });
            }
            // Only allow dragging own units during preparation phase
            console.log("Drag check - Phase: ".concat(this.gameState.phase, ", Unit Player: ").concat(clickedUnit.playerId, ", Current Player: ").concat(this.currentPlayerId, ", Has Sprite: ").concat(!!clickedSprite));
            if (this.gameState.phase === 'preparation' &&
                clickedUnit.playerId === this.currentPlayerId &&
                clickedSprite) {
                console.log('🎯 STARTING UNIT DRAG - NEW VERSION!');
                this.selectedUnit = clickedSprite;
                this.isDragging = true;
                this.draggedUnit = clickedUnit;
                // Expose drag state to window for React components
                window.isDragging = true;
                // Store original position for potential snap-back
                this.originalDragPosition = clickedSprite.position.clone();
                // Lift the unit sprite above everything else
                clickedSprite.setDepth(2000);
                // Add enhanced visual effects to show it's being picked up
                this.tweens.add({
                    targets: clickedSprite,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    y: clickedSprite.y - 15, // Lift the unit up
                    duration: 200,
                    ease: 'Back.easeOut'
                });
                // Create a drag preview container similar to the purchase panel one
                console.log('🖼️ CALLING createUnitDragPreview!');
                this.createUnitDragPreview(clickedUnit, clickedSprite.x, clickedSprite.y);
                console.log('🖼️ unitDragPreview after creation:', !!this.unitDragPreview);
                // Make the original unit semi-transparent
                clickedSprite.setAlpha(0.5);
                // Add a shadow beneath the unit
                this.createDragShadow(clickedSprite);
                // Show sell zone when dragging a unit
                this.showSellZone();
                // Show helpful instruction
                this.showDragInstruction();
                console.log("\u2705 DRAG STARTED: ".concat(clickedUnit.name, " (").concat(clickedUnit.id, ")"));
                console.log("Unit current position:", clickedUnit.position);
            }
            else {
                console.log("\u274C Cannot drag - Phase: ".concat(this.gameState.phase, ", Player match: ").concat(clickedUnit.playerId === this.currentPlayerId, ", Has sprite: ").concat(!!clickedSprite));
            }
        }
        else {
            // Hide tooltip when clicking empty space
            if (this.tooltip) {
                this.tooltip.hide();
            }
        }
    };
    MainScene.prototype.onPointerMove = function (pointer) {
        // Safety check: ensure we have a valid game state and proper phase before processing pointer moves
        if (!this.gameState || this.gameState.phase !== 'preparation') {
            this.grid.clearHighlight();
            return;
        }
        var worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // CENTRALIZED HIGHLIGHTING SYSTEM - only one highlight call per frame
        var highlightGridPos = null;
        // Handle placement mode - only during preparation phase
        if (this.placementMode && this.dragPreview && this.gameState.phase === 'preparation') {
            // Update drag preview position to follow cursor
            this.dragPreview.setPosition(worldPoint.x, worldPoint.y);
            // Calculate highlight position for placement mode (raw cursor position)
            highlightGridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
            // Add visual feedback for valid/invalid drop zones
            var isValid = this.grid.isValidPlacement(highlightGridPos.x, highlightGridPos.y, this.currentPlayerId || undefined);
            this.updateDragPreviewValidation(isValid);
        }
        // Handle unit dragging - only during preparation phase
        else if (this.isDragging && this.selectedUnit && this.gameState.phase === 'preparation') {
            // Only update unit drag preview position, keep original unit in place but semi-transparent
            if (this.unitDragPreview) {
                this.unitDragPreview.setPosition(worldPoint.x, worldPoint.y - 25);
            }
            else {
                console.warn('🚨 NO UNIT DRAG PREVIEW DURING MOVE!');
            }
            // Update shadow position if it exists
            if (this.dragShadow) {
                this.dragShadow.setPosition(worldPoint.x, worldPoint.y + 15);
            }
            // Check if over sell zone
            this.checkSellZoneHover(pointer.x, pointer.y);
            // Calculate highlight position for drag mode (offset cursor position to match visual unit position)
            highlightGridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y - 25);
            // Add visual feedback for valid/invalid drop zones - use same position as highlighting
            var isValid = this.grid.isValidPlacement(highlightGridPos.x, highlightGridPos.y, this.currentPlayerId || undefined) && !this.isOverSellZone;
            // Update drag preview validation
            if (this.isOverSellZone) {
                this.updateUnitDragPreviewValidation('sell');
            }
            else if (isValid) {
                this.updateUnitDragPreviewValidation('valid');
            }
            else {
                this.updateUnitDragPreviewValidation('invalid');
            }
            console.log("Dragging to grid (".concat(highlightGridPos.x, ", ").concat(highlightGridPos.y, "), valid: ").concat(isValid, ", over sell zone: ").concat(this.isOverSellZone));
        }
        // Handle normal hover highlighting and tooltip (only when not dragging or placing)
        else if (!this.isDragging && !this.placementMode) {
            // Calculate highlight position for hover mode (raw cursor position)
            highlightGridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
            this.handleTooltipHover(worldPoint);
        }
        // SINGLE POINT OF HIGHLIGHTING CONTROL
        if (highlightGridPos) {
            this.grid.highlightCell(highlightGridPos.x, highlightGridPos.y, this.currentPlayerId || undefined);
        }
        else {
            this.grid.clearHighlight();
        }
    };
    MainScene.prototype.handleTooltipHover = function (worldPoint) {
        if (!this.gameState || !this.tooltip)
            return;
        // Check if hovering over a unit using more efficient hit testing
        var pointer = this.input.activePointer;
        var hitObjects = this.input.hitTestPointer(pointer);
        var _loop_3 = function (obj) {
            if (obj instanceof UnitSprite_1.default) {
                // Find the unit data for this sprite
                var hoveredUnit_1 = this_3.gameState.players
                    .flatMap(function (p) { return p.units; })
                    .find(function (u) { return u.id === obj.unitId; }) ||
                    this_3.gameState.enemyUnits.find(function (u) { return u.id === obj.unitId; }) || null;
                if (hoveredUnit_1 && hoveredUnit_1.position) {
                    var owner = this_3.gameState.players.find(function (p) {
                        return p.units.some(function (u) { return u.id === hoveredUnit_1.id; });
                    });
                    var ownerName = owner ? owner.name : 'Enemy';
                    // Position tooltip at the unit's grid cell center, not mouse cursor
                    var unitWorldPos = this_3.grid.gridToWorld(hoveredUnit_1.position.x, hoveredUnit_1.position.y);
                    // Show owner info for placed units (units with positions)
                    this_3.tooltip.showForUnit(hoveredUnit_1, ownerName, unitWorldPos.x, unitWorldPos.y, true);
                }
                return { value: void 0 };
            }
        };
        var this_3 = this;
        for (var _i = 0, hitObjects_2 = hitObjects; _i < hitObjects_2.length; _i++) {
            var obj = hitObjects_2[_i];
            var state_3 = _loop_3(obj);
            if (typeof state_3 === "object")
                return state_3.value;
        }
        // If not hovering over any unit, hide tooltip
        this.tooltip.hide();
    };
    MainScene.prototype.onPointerUp = function (pointer) {
        var _this = this;
        console.log("\uD83C\uDFAF POINTER UP - isDragging: ".concat(this.isDragging, ", hasUnit: ").concat(!!this.selectedUnit, ", hasState: ").concat(!!this.gameState));
        if (!this.isDragging || !this.selectedUnit || !this.gameState) {
            this.isDragging = false;
            this.selectedUnit = null;
            this.hideSellZone();
            return;
        }
        var worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // Calculate drop position based on where the unit sprite visually appears (accounting for the 25px lift)
        var gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y - 25);
        // Get the unit data
        var unit = this.gameState.players
            .flatMap(function (p) { return p.units; })
            .find(function (u) { return u.id === _this.selectedUnit.unitId; });
        console.log("\uD83C\uDFAF Drop target: grid(".concat(gridPos.x, ", ").concat(gridPos.y, "), unit current pos:"), unit === null || unit === void 0 ? void 0 : unit.position);
        // Check if dropped in sell zone
        if (this.isOverSellZone && this.draggedUnit) {
            console.log("\uD83D\uDCB0 Selling unit ".concat(this.draggedUnit.name, " for 75% refund"));
            this.sellUnit(this.draggedUnit.id);
            // Hide the unit sprite after selling
            this.selectedUnit.setVisible(false);
        }
        // Check if valid placement
        else if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
            // Check if position actually changed
            var positionChanged = !(unit === null || unit === void 0 ? void 0 : unit.position) ||
                unit.position.x !== gridPos.x ||
                unit.position.y !== gridPos.y;
            console.log("\uD83C\uDFAF Position changed: ".concat(positionChanged));
            if (positionChanged) {
                console.log("\uD83D\uDCE4 CALLING moveUnit: ".concat(this.selectedUnit.unitId, " to (").concat(gridPos.x, ", ").concat(gridPos.y, ")"));
                console.log("\uD83D\uDCE4 moveUnit function exists: ".concat(!!window.moveUnit));
                console.log("\uD83D\uDCE4 gameContext exists: ".concat(!!window.gameContext));
                // Use moveUnit for repositioning
                if (window.moveUnit) {
                    console.log("\uD83D\uDCE4 Calling (window as any).moveUnit with:", {
                        unitId: this.selectedUnit.unitId,
                        position: gridPos
                    });
                    window.moveUnit(this.selectedUnit.unitId, gridPos);
                    console.log("\uD83D\uDCE4 moveUnit call completed");
                }
                else {
                    console.error('❌ moveUnit function not available on window');
                }
                // Optimistically update position while waiting for server confirmation
                var worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
                this.selectedUnit.setPosition(worldPos.x, worldPos.y);
            }
            else {
                // No movement needed, just snap back to current position
                var worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
                this.selectedUnit.setPosition(worldPos.x, worldPos.y);
                console.log("\uD83C\uDFAF No position change needed");
            }
        }
        else {
            // Invalid placement - return to original position
            if (unit && unit.position) {
                var worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
                this.selectedUnit.setPosition(worldPos.x, worldPos.y);
                console.log("\u274C Invalid placement, returning unit ".concat(this.selectedUnit.unitId, " to original position"));
            }
            else {
                // Unit has no position, remove it from the grid visually
                console.log("\u274C Unit ".concat(this.selectedUnit.unitId, " has no valid position, moving off grid"));
                this.selectedUnit.setPosition(-100, -100); // Move off screen
            }
        }
        // Reset visual state
        this.selectedUnit.clearTint(); // Clear any tint
        // Clean up glow effect
        var glowEffect = this.selectedUnit.getData('glowEffect');
        if (glowEffect) {
            this.tweens.killTweensOf(glowEffect);
            glowEffect.destroy();
            this.selectedUnit.setData('glowEffect', null);
        }
        // Restore original scale and position with animation
        this.tweens.add({
            targets: this.selectedUnit,
            scaleX: 1,
            scaleY: 1,
            y: this.selectedUnit.y + 15, // Lower the unit back down
            duration: 200,
            ease: 'Back.easeIn'
        });
        // Restore original depth based on y position
        this.selectedUnit.setDepth(this.selectedUnit.y);
        // Destroy drag preview
        this.destroyUnitDragPreview();
        // Destroy drag shadow
        this.destroyDragShadow();
        // Hide sell zone
        this.hideSellZone();
        // Hide drag instruction
        this.hideDragInstruction();
        this.selectedUnit = null;
        this.isDragging = false;
        this.draggedUnit = null;
        this.originalDragPosition = null;
        this.grid.clearHighlight();
        // Clear drag state from window for React components
        window.isDragging = false;
    };
    MainScene.prototype.createDragPreview = function (unit, x, y) {
        // Create drag preview container
        this.dragPreview = this.add.container(x, y);
        this.dragPreview.setDepth(2000); // Very high depth to appear above everything
        // Create the box background
        var boxWidth = 80;
        var boxHeight = 80;
        var cornerRadius = 12;
        // Create box graphics
        var box = this.add.graphics();
        // Box shadow (slight offset for 3D effect)
        box.fillStyle(0x000000, 0.3);
        box.fillRoundedRect(-boxWidth / 2 + 2, -boxHeight / 2 + 2, boxWidth, boxHeight, cornerRadius);
        // Main box background
        box.fillStyle(0x2a2a2a, 0.95);
        box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        // Golden border
        box.lineStyle(3, 0xFFD700, 1);
        box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        // Inner highlight border
        box.lineStyle(1, 0xFFFFFF, 0.3);
        box.strokeRoundedRect(-boxWidth / 2 + 4, -boxHeight / 2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
        this.dragPreview.add(box);
        // Create unit sprite inside the box
        var textureKey = unit.name.toLowerCase();
        var unitSprite;
        if (this.textures.exists(textureKey)) {
            var texture = this.textures.get(textureKey);
            var frameNames = texture.getFrameNames();
            // Find idle frame or use first frame
            var idleFrame = frameNames.find(function (frame) {
                return frame.toLowerCase().includes('idle');
            }) || frameNames[0];
            unitSprite = this.add.sprite(0, -5, textureKey, idleFrame);
        }
        else {
            // Fallback sprite
            unitSprite = this.add.sprite(0, -5, '__DEFAULT');
        }
        unitSprite.setScale(0.6); // Slightly smaller to fit nicely in the box
        // Add unit name below the sprite
        var nameText = this.add.text(0, 25, unit.name, {
            fontSize: '10px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5);
        this.dragPreview.add([unitSprite, nameText]);
        // Add subtle floating animation
        this.tweens.add({
            targets: this.dragPreview,
            y: this.dragPreview.y - 3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Add gentle rotation
        this.tweens.add({
            targets: this.dragPreview,
            angle: { from: -2, to: 2 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    };
    MainScene.prototype.destroyDragPreview = function () {
        if (this.dragPreview) {
            // Stop any tweens on the drag preview
            this.tweens.killTweensOf(this.dragPreview);
            this.dragPreview.destroy();
            this.dragPreview = null;
        }
    };
    MainScene.prototype.destroyUnitDragPreview = function () {
        if (this.unitDragPreview) {
            // Stop any tweens on the unit drag preview
            this.tweens.killTweensOf(this.unitDragPreview);
            this.unitDragPreview.destroy();
            this.unitDragPreview = null;
        }
    };
    MainScene.prototype.updateDragPreviewValidation = function (isValid) {
        if (!this.dragPreview)
            return;
        // Get the graphics object (first child)
        var box = this.dragPreview.getAt(0);
        if (!box)
            return;
        box.clear();
        var boxWidth = 80;
        var boxHeight = 80;
        var cornerRadius = 12;
        // Box shadow (slight offset for 3D effect)
        box.fillStyle(0x000000, 0.3);
        box.fillRoundedRect(-boxWidth / 2 + 2, -boxHeight / 2 + 2, boxWidth, boxHeight, cornerRadius);
        // Change box color based on validity
        if (isValid) {
            // Valid placement - keep golden theme
            box.fillStyle(0x2a2a2a, 0.95);
            box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            box.lineStyle(3, 0xFFD700, 1); // Golden border
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            box.lineStyle(1, 0xFFFFFF, 0.3); // Inner highlight
            box.strokeRoundedRect(-boxWidth / 2 + 4, -boxHeight / 2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
        }
        else {
            // Invalid placement - red theme
            box.fillStyle(0x3a1a1a, 0.95); // Dark red background
            box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            box.lineStyle(3, 0xFF4444, 1); // Red border
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            box.lineStyle(1, 0xFF8888, 0.3); // Light red inner highlight
            box.strokeRoundedRect(-boxWidth / 2 + 4, -boxHeight / 2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
        }
    };
    MainScene.prototype.createUnitDragPreview = function (unit, x, y) {
        // Destroy existing unit drag preview if it exists
        if (this.unitDragPreview) {
            this.unitDragPreview.destroy();
            this.unitDragPreview = null;
        }
        // Create drag preview container for unit repositioning
        this.unitDragPreview = this.add.container(x, y);
        this.unitDragPreview.setDepth(2000); // Very high depth to appear above everything
        this.unitDragPreview.setAlpha(1); // Ensure it's fully visible
        this.unitDragPreview.setVisible(true); // Ensure it's visible
        // Create a nice shaded box background
        var boxWidth = 90;
        var boxHeight = 90;
        var cornerRadius = 8;
        // Create box graphics
        var box = this.add.graphics();
        // Box shadow (multiple layers for depth)
        box.fillStyle(0x000000, 0.4);
        box.fillRoundedRect(-boxWidth / 2 + 4, -boxHeight / 2 + 4, boxWidth, boxHeight, cornerRadius);
        box.fillStyle(0x000000, 0.2);
        box.fillRoundedRect(-boxWidth / 2 + 2, -boxHeight / 2 + 2, boxWidth, boxHeight, cornerRadius);
        // Main box background with gradient effect
        box.fillStyle(0x1a1a1a, 0.9);
        box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        // Subtle inner shadow
        box.lineStyle(2, 0x000000, 0.3);
        box.strokeRoundedRect(-boxWidth / 2 + 1, -boxHeight / 2 + 1, boxWidth - 2, boxHeight - 2, cornerRadius - 1);
        // Outer border - will be updated based on validity
        box.lineStyle(3, 0x666666, 0.8);
        box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        this.unitDragPreview.add(box);
        // Create unit sprite inside the box
        var textureKey = unit.name.toLowerCase();
        var unitSprite;
        if (this.textures.exists(textureKey)) {
            var texture = this.textures.get(textureKey);
            var frameNames = texture.getFrameNames();
            // Find idle frame or use first frame
            var idleFrame = frameNames.find(function (frame) {
                return frame.toLowerCase().includes('idle');
            }) || frameNames[0];
            unitSprite = this.add.sprite(0, -8, textureKey, idleFrame);
        }
        else {
            // Fallback sprite
            unitSprite = this.add.sprite(0, -8, '__DEFAULT');
        }
        unitSprite.setScale(0.7); // Scaled to fit nicely in the box
        // Add unit name below the sprite
        var nameText = this.add.text(0, 28, unit.name, {
            fontSize: '11px',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5);
        this.unitDragPreview.add([unitSprite, nameText]);
        // Add subtle floating animation
        this.tweens.add({
            targets: this.unitDragPreview,
            y: this.unitDragPreview.y - 2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    };
    MainScene.prototype.updateUnitDragPreviewValidation = function (state) {
        if (!this.unitDragPreview)
            return;
        // Get the graphics object (first child)
        var box = this.unitDragPreview.getAt(0);
        if (!box)
            return;
        box.clear();
        var boxWidth = 90;
        var boxHeight = 90;
        var cornerRadius = 8;
        // Box shadow (multiple layers for depth)
        box.fillStyle(0x000000, 0.4);
        box.fillRoundedRect(-boxWidth / 2 + 4, -boxHeight / 2 + 4, boxWidth, boxHeight, cornerRadius);
        box.fillStyle(0x000000, 0.2);
        box.fillRoundedRect(-boxWidth / 2 + 2, -boxHeight / 2 + 2, boxWidth, boxHeight, cornerRadius);
        // Main box background
        box.fillStyle(0x1a1a1a, 0.9);
        box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        // Subtle inner shadow
        box.lineStyle(2, 0x000000, 0.3);
        box.strokeRoundedRect(-boxWidth / 2 + 1, -boxHeight / 2 + 1, boxWidth - 2, boxHeight - 2, cornerRadius - 1);
        // Change border color based on state
        if (state === 'valid') {
            // Valid placement - subtle green border
            box.lineStyle(3, 0x4CAF50, 0.8);
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            // Inner highlight
            box.lineStyle(1, 0x81C784, 0.4);
            box.strokeRoundedRect(-boxWidth / 2 + 3, -boxHeight / 2 + 3, boxWidth - 6, boxHeight - 6, cornerRadius - 2);
        }
        else if (state === 'invalid') {
            // Invalid placement - orange border
            box.lineStyle(3, 0xFF9800, 0.8);
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            // Inner highlight
            box.lineStyle(1, 0xFFB74D, 0.4);
            box.strokeRoundedRect(-boxWidth / 2 + 3, -boxHeight / 2 + 3, boxWidth - 6, boxHeight - 6, cornerRadius - 2);
        }
        else if (state === 'sell') {
            // Sell zone - red border
            box.lineStyle(3, 0xF44336, 0.8);
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
            // Inner highlight
            box.lineStyle(1, 0xEF5350, 0.4);
            box.strokeRoundedRect(-boxWidth / 2 + 3, -boxHeight / 2 + 3, boxWidth - 6, boxHeight - 6, cornerRadius - 2);
        }
        else {
            // Default state - neutral border
            box.lineStyle(3, 0x666666, 0.8);
            box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        }
    };
    MainScene.prototype.cancelDrag = function () {
        var _this = this;
        if (!this.isDragging || !this.selectedUnit || !this.gameState) {
            return;
        }
        // Return unit to its original position
        var unit = this.gameState.players
            .flatMap(function (p) { return p.units; })
            .find(function (u) { return u.id === _this.selectedUnit.unitId; });
        if (unit && unit.position) {
            var worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
            this.selectedUnit.setPosition(worldPos.x, worldPos.y);
        }
        // Reset visual state
        this.selectedUnit.setAlpha(1);
        this.selectedUnit.clearTint();
        // Restore original scale and position
        this.tweens.add({
            targets: this.selectedUnit,
            scaleX: 1,
            scaleY: 1,
            y: this.selectedUnit.y + 15, // Lower back down
            duration: 200,
            ease: 'Back.easeIn'
        });
        // Destroy drag preview
        this.destroyUnitDragPreview();
        // Destroy drag shadow
        this.destroyDragShadow();
        // Clear drag state
        this.selectedUnit = null;
        this.isDragging = false;
        this.draggedUnit = null;
        this.grid.clearHighlight();
        // Clear drag state from window for React components
        window.isDragging = false;
        // Hide sell zone
        this.hideSellZone();
        // Hide drag instruction
        this.hideDragInstruction();
        console.log('Drag operation cancelled');
    };
    MainScene.prototype.updateGameState = function (gameState) {
        var _a;
        console.log("MainScene.updateGameState called - phase: ".concat(gameState.phase, ", players: ").concat(gameState.players.length));
        this.gameState = gameState;
        // Clear any stray highlights when game state updates
        this.grid.clearHighlight();
        // Update current player ID if not set
        if (!this.currentPlayerId && ((_a = window.gameContext) === null || _a === void 0 ? void 0 : _a.player)) {
            this.currentPlayerId = window.gameContext.player.id;
        }
        // Handle phase changes first
        if (gameState.phase === 'combat') {
            this.startCombat();
        }
        else if (gameState.phase === 'preparation' || gameState.phase === 'post-combat') {
            this.stopCombat();
        }
        // Update background after phase change
        this.updateBackground();
        // Update grid state
        this.grid.updateGrid(gameState.grid);
        // Update units
        this.updateUnits();
    };
    MainScene.prototype.updateBackground = function () {
        if (!this.gameState)
            return;
        console.log('Updating background for phase:', this.gameState.phase, 'floor:', this.gameState.currentFloor);
        var backgroundKey = 'battle1';
        // During preparation or post-combat phase, use a neutral/preparation background
        if (this.gameState.phase === 'preparation' || this.gameState.phase === 'post-combat') {
            // Use a darker, more subdued version for preparation
            backgroundKey = 'battle1'; // Keep using battle1 but will add a dark overlay
            console.log('Using preparation background');
        }
        else {
            // During combat, use floor-based backgrounds
            var floor = this.gameState.currentFloor;
            if (floor <= 3)
                backgroundKey = 'battle1';
            else if (floor <= 6)
                backgroundKey = 'battle2';
            else if (floor <= 8)
                backgroundKey = 'battle3';
            else
                backgroundKey = 'battle4';
            console.log('Using combat background:', backgroundKey);
        }
        // Remove existing background elements
        var existingBg = this.children.getByName('background');
        if (existingBg)
            existingBg.destroy();
        var existingOverlay = this.children.getByName('phase-overlay');
        if (existingOverlay)
            existingOverlay.destroy();
        // Add new background - ensure it covers the entire screen
        var bg = this.add.image(0, 0, backgroundKey);
        bg.setOrigin(0, 0); // Top-left origin
        bg.setName('background');
        // Get the actual canvas/camera dimensions
        var screenWidth = this.scale.gameSize.width;
        var screenHeight = this.scale.gameSize.height;
        // Scale background to exactly match the full screen (100% coverage)
        var scaleX = screenWidth / bg.width;
        var scaleY = screenHeight / bg.height;
        // Use exact scaling to fill entire screen
        bg.setDisplaySize(screenWidth, screenHeight);
        bg.setDepth(-100);
        console.log('Background scaling:', {
            imageSize: { width: bg.width, height: bg.height },
            screenSize: { width: screenWidth, height: screenHeight },
            scale: { x: scaleX, y: scaleY },
            displaySize: { width: bg.displayWidth, height: bg.displayHeight }
        });
        console.log('Background scaling debug:', {
            screenSize: { width: this.cameras.main.width, height: this.cameras.main.height },
            imageSize: { width: bg.width, height: bg.height },
            scales: { scaleX: scaleX, scaleY: scaleY, finalScale: scale },
            finalSize: {
                width: bg.width * scale,
                height: bg.height * scale
            }
        });
        // Add phase-specific overlay
        if (this.gameState.phase === 'preparation' || this.gameState.phase === 'post-combat') {
            // Add a blue-tinted overlay for preparation phase
            var screenWidth_1 = this.scale.gameSize.width;
            var screenHeight_1 = this.scale.gameSize.height;
            var overlay = this.add.rectangle(0, 0, screenWidth_1, screenHeight_1, 0x1a1a2e, 0.6);
            overlay.setOrigin(0, 0); // Top-left origin
            overlay.setName('phase-overlay');
            overlay.setDepth(-90);
        }
    };
    MainScene.prototype.updateUnits = function () {
        if (!this.gameState)
            return;
        // Get all units (player and enemy)
        var allUnits = __spreadArray(__spreadArray([], this.gameState.players.flatMap(function (p) { return p.units; }), true), this.gameState.enemyUnits, true);
        // Use the consolidated updateUnitsInternal method
        this.updateUnitsInternal(allUnits, false); // false indicates this is not a combat update
    };
    MainScene.prototype.updateUnitsInternal = function (allUnits, isCombatUpdate) {
        var _this = this;
        var _loop_4 = function (id, sprite) {
            if (!allUnits.find(function (u) { return u.id === id; })) {
                sprite.destroy();
                this_4.unitSprites.delete(id);
            }
        };
        var this_4 = this;
        // Remove sprites for units that no longer exist
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            _loop_4(id, sprite);
        }
        // Update or create sprites for existing units
        for (var _c = 0, allUnits_1 = allUnits; _c < allUnits_1.length; _c++) {
            var unit = allUnits_1[_c];
            // Skip units without positions during preparation phase
            if (!unit.position) {
                continue;
            }
            // Debug wizards
            if (unit.name.toLowerCase() === 'wizard') {
                console.log("\uD83E\uDDD9 Found wizard unit in updateUnitsInternal: ".concat(unit.name, " (").concat(unit.id, ") at (").concat(unit.position.x, ", ").concat(unit.position.y, ")"));
            }
            var sprite = this.unitSprites.get(unit.id);
            if (!sprite) {
                // Create new sprite
                var worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
                sprite = new UnitSprite_1.default(this, worldPos.x, worldPos.y, unit);
                this.unitSprites.set(unit.id, sprite);
                // Listen for death animation completion
                sprite.on('death_animation_complete', function (unitId) {
                    var मृतSprite = _this.unitSprites.get(unitId); // "मृतSprite" means "deadSprite" in Hindi
                    if (मृतSprite) {
                        console.log('Death animation complete for unit', unitId, ', removing from battlefield');
                        मृतSprite.setData('destroying', true); // Mark as being destroyed
                        मृतSprite.destroy();
                        _this.unitSprites.delete(unitId);
                    }
                });
            }
            else if (unit.position) {
                // Handle position updates differently for combat vs non-combat updates
                var worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
                if (isCombatUpdate) {
                    // During combat updates, use smooth movement with tweens
                    var distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, worldPos.x, worldPos.y);
                    var duration = Math.min(500, Math.max(200, distance * 2)); // 200-500ms based on distance
                    // Only create tween if sprite is still active and position has changed significantly
                    if (sprite.active && distance > 1) {
                        this.tweens.add({
                            targets: sprite,
                            x: worldPos.x,
                            y: worldPos.y,
                            duration: duration,
                            ease: 'Power2.InOut'
                        });
                    }
                }
                else {
                    // During regular updates, use immediate position updates for units that have moved
                    var distanceThreshold = 1; // Only update if moved significantly
                    var dx = Math.abs(sprite.x - worldPos.x);
                    var dy = Math.abs(sprite.y - worldPos.y);
                    if (dx > distanceThreshold || dy > distanceThreshold) {
                        console.log("Moving sprite ".concat(unit.id, " from (").concat(sprite.x, ", ").concat(sprite.y, ") to (").concat(worldPos.x, ", ").concat(worldPos.y, ")"));
                        sprite.setPosition(worldPos.x, worldPos.y);
                    }
                }
            }
            // Update sprite state only if sprite still exists and is active
            if (sprite && sprite.active && !sprite.getData('destroying')) {
                // Store old unit data for combat-specific logic
                var oldUnit = isCombatUpdate ? __assign({}, sprite.unit) : null;
                // Update unit data (health, status, etc.) - this has its own safety checks
                sprite.updateUnit(unit);
                // Combat-specific logic for projectile creation
                if (isCombatUpdate && oldUnit) {
                    // Check if unit just started attacking (for projectile creation)
                    var justStartedAttacking = oldUnit.status !== 'attacking' && unit.status === 'attacking';
                    // Debug logging for all ranged units
                    if (unit.status === 'attacking' && this.isRangedUnit(unit)) {
                        console.log("\uD83C\uDFAF ".concat(unit.name, " is attacking, old status: ").concat(oldUnit.status, ", new status: ").concat(unit.status, ", just started: ").concat(justStartedAttacking));
                    }
                    // Create projectile for ranged attackers
                    if (justStartedAttacking && this.isRangedUnit(unit)) {
                        console.log("\uD83D\uDE80 RANGED UNIT STARTED ATTACKING: ".concat(unit.name, " (ID: ").concat(unit.id, ")"));
                        // Check cooldown to avoid duplicate projectiles
                        var lastAttack = this.lastAttackTime.get(unit.id) || 0;
                        var now = this.time.now;
                        // Wizard needs longer cooldown due to charging time
                        var cooldownTime = unit.name.toLowerCase() === 'wizard' ? 3000 : 500;
                        console.log("\u23F0 Cooldown check for ".concat(unit.name, ": now=").concat(now, ", lastAttack=").concat(lastAttack, ", cooldownTime=").concat(cooldownTime, ", timeSince=").concat(now - lastAttack));
                        if (now - lastAttack > cooldownTime) { // Different cooldown for wizard vs other ranged
                            console.log("\uD83C\uDFAF Creating projectile for ".concat(unit.name, " (").concat(unit.id, ")"));
                            if (unit.name.toLowerCase() === 'wizard') {
                                console.log("\uD83E\uDDD9 WIZARD ATTACK DETECTED! Calling createProjectileForAttack");
                            }
                            this.createProjectileForAttack(unit, allUnits);
                            this.lastAttackTime.set(unit.id, now);
                        }
                        else {
                            console.log("\u23F0 Projectile on cooldown for ".concat(unit.name, ", last attack: ").concat(now - lastAttack, "ms ago"));
                        }
                    }
                }
            }
        }
    };
    MainScene.prototype.playBackgroundMusic = function () {
        if (!this.gameState)
            return;
        // Stop current music
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        var floor = this.gameState.currentFloor;
        var phase = this.gameState.phase;
        var musicKey = '';
        if (phase === 'combat') {
            if (floor <= 3)
                musicKey = 'battletheme1';
            else if (floor <= 6)
                musicKey = 'battletheme2';
            else if (floor <= 8)
                musicKey = 'battletheme3';
            else
                musicKey = 'battletheme4';
        }
        else {
            if (floor <= 3)
                musicKey = 'theme1';
            else if (floor <= 6)
                musicKey = 'theme2';
            else if (floor <= 8)
                musicKey = 'theme3';
            else
                musicKey = 'theme4';
        }
        this.backgroundMusic = this.sound.add(musicKey, {
            loop: true,
            volume: 0.3
        });
        this.backgroundMusic.play();
    };
    MainScene.prototype.startCombat = function () {
        // Disable unit dragging
        this.input.enabled = false;
        // Hide grid during combat
        this.grid.setGridVisible(false);
        // Start combat animations and AI
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            sprite.startCombat();
        }
    };
    MainScene.prototype.stopCombat = function () {
        // Re-enable unit dragging
        this.input.enabled = true;
        // Show grid again during preparation
        this.grid.setGridVisible(true);
        // Stop combat animations
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            sprite.stopCombat();
        }
        // Ensure background is updated for preparation phase
        this.updateBackground();
        // Clear any remaining projectiles
        for (var _c = 0, _d = this.projectiles; _c < _d.length; _c++) {
            var projectile = _d[_c];
            projectile.destroy();
        }
        this.projectiles = [];
    };
    MainScene.prototype.update = function (time, delta) {
        // Update unit sprites
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            sprite.update(time, delta);
        }
        // Update projectiles
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            var projectile = this.projectiles[i];
            if (projectile.active) {
                projectile.update(time, delta);
            }
            else {
                this.projectiles.splice(i, 1);
            }
        }
    };
    MainScene.prototype.updateCombatUnits = function (playerUnits, enemyUnits) {
        console.log("\uD83C\uDFAE updateCombatUnits called with ".concat(playerUnits.length, " player units and ").concat(enemyUnits.length, " enemy units"));
        var allUnits = __spreadArray(__spreadArray([], playerUnits, true), enemyUnits, true);
        // Test: Create a visible rectangle every time this is called
        var testRect = this.add.rectangle(100 + Math.random() * 600, 100 + Math.random() * 400, 20, 20, 0xff00ff);
        testRect.setDepth(10000);
        this.time.delayedCall(1000, function () { return testRect.destroy(); });
        // Log any wizards found
        var wizards = allUnits.filter(function (u) { return u.name.toLowerCase() === 'wizard'; });
        console.log("\uD83E\uDDD9 Found ".concat(wizards.length, " wizards:"), wizards.map(function (w) { return ({
            name: w.name,
            id: w.id,
            status: w.status,
            position: w.position
        }); }));
        if (wizards.length > 0) {
            console.log("\uD83E\uDDD9 Found ".concat(wizards.length, " wizard(s) in combat update:"));
            wizards.forEach(function (w) { return console.log("  - ".concat(w.name, " (").concat(w.id, "): status=").concat(w.status, ", position=").concat(w.position ? "(".concat(w.position.x, ",").concat(w.position.y, ")") : 'null')); });
        }
        // Use the consolidated updateUnitsInternal method to avoid duplicate processing
        this.updateUnitsInternal(allUnits, true); // true indicates this is a combat update
    };
    MainScene.prototype.shutdown = function () {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        for (var _i = 0, _a = this.unitSprites; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], sprite = _b[1];
            sprite.destroy();
        }
        this.unitSprites.clear();
    };
    MainScene.prototype.enterPlacementMode = function (unit) {
        var _this = this;
        var _a, _b;
        if (((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.phase) !== 'preparation')
            return;
        this.placementMode = true;
        this.placementUnit = unit;
        // Expose placement mode as drag state to window for React components
        window.isDragging = true;
        // Create drag preview for placement (start off-screen until first mouse move)
        var placementUnit = {
            id: 'placement-preview',
            name: unit.name,
            playerId: this.currentPlayerId || '',
            health: unit.health,
            maxHealth: unit.health,
            damage: unit.damage,
            speed: unit.speed,
            status: 'idle',
            position: null,
            buffs: []
        };
        this.createDragPreview(placementUnit, -100, -100);
        // Add escape key to cancel
        (_b = this.input.keyboard) === null || _b === void 0 ? void 0 : _b.once('keydown-ESC', function () {
            _this.exitPlacementMode();
        });
    };
    MainScene.prototype.exitPlacementMode = function () {
        this.placementMode = false;
        this.placementUnit = null;
        this.placedUnit = null;
        // Clear drag state from window for React components
        window.isDragging = false;
        // Destroy drag preview
        this.destroyDragPreview();
        this.grid.clearHighlight();
    };
    MainScene.prototype.enterPlacementModeForUnit = function (unit) {
        var _this = this;
        var _a, _b;
        if (((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.phase) !== 'preparation')
            return;
        this.placementMode = true;
        this.placementUnit = null; // We're placing an already purchased unit
        this.placedUnit = unit; // Store the unit to place
        // Expose placement mode as drag state to window for React components
        window.isDragging = true;
        // Create drag preview for placement (start off-screen until first mouse move)
        this.createDragPreview(unit, -100, -100);
        // Add escape key to cancel
        (_b = this.input.keyboard) === null || _b === void 0 ? void 0 : _b.once('keydown-ESC', function () {
            _this.exitPlacementMode();
        });
    };
    MainScene.prototype.isRangedUnit = function (unit) {
        var rangedUnitTypes = ['wizard', 'priest', 'druidess', 'storms'];
        var unitNameLower = unit.name.toLowerCase();
        var isRanged = rangedUnitTypes.includes(unitNameLower);
        console.log("Checking if ".concat(unit.name, " (normalized: \"").concat(unitNameLower, "\") is ranged: ").concat(isRanged));
        console.log("Available ranged types:", rangedUnitTypes);
        return isRanged;
    };
    MainScene.prototype.createProjectileForAttack = function (attacker, allUnits) {
        var _this = this;
        var _a;
        console.log("\uD83D\uDCCD createProjectileForAttack called for ".concat(attacker.name));
        // Check if attacker has a valid position
        if (!attacker.position) {
            console.log("\u274C Attacker ".concat(attacker.name, " has no position"));
            return;
        }
        // Find the closest enemy unit as the target
        var isPlayerUnit = ((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.players.some(function (p) {
            return p.units.some(function (u) { return u.id === attacker.id; });
        })) || false;
        var enemies = allUnits.filter(function (u) {
            var _a, _b;
            var isEnemy = isPlayerUnit ?
                (_a = _this.gameState) === null || _a === void 0 ? void 0 : _a.enemyUnits.some(function (e) { return e.id === u.id; }) :
                (_b = _this.gameState) === null || _b === void 0 ? void 0 : _b.players.some(function (p) { return p.units.some(function (pu) { return pu.id === u.id; }); });
            return isEnemy && u.status !== 'dead' && u.position; // Also filter out enemies without positions
        });
        if (enemies.length === 0)
            return;
        // Find closest enemy
        var closestEnemy = null;
        var closestDistance = Infinity;
        for (var _i = 0, enemies_1 = enemies; _i < enemies_1.length; _i++) {
            var enemy = enemies_1[_i];
            // Enemy position is guaranteed to exist due to filter above, but double-check for safety
            if (!enemy.position)
                continue;
            var distance = Math.abs(enemy.position.x - attacker.position.x) +
                Math.abs(enemy.position.y - attacker.position.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        if (!closestEnemy || !closestEnemy.position)
            return;
        console.log("Creating projectile: ".concat(attacker.name, " attacking ").concat(closestEnemy.name));
        // Get world positions
        var startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
        var targetPos = this.grid.gridToWorld(closestEnemy.position.x, closestEnemy.position.y);
        // Determine projectile texture based on unit type
        var textureKey = attacker.name.toLowerCase();
        var projectileScale = 3.0; // Increased even more for better visibility of smaller Charge_1_X frames
        if (attacker.name.toLowerCase() === 'priest') {
            // For priest, we'll create a generic holy projectile effect
            // Since priest doesn't have projectile frames, we'll use a particle effect
            this.createHolyProjectileEffect(startPos.x, startPos.y, targetPos.x, targetPos.y);
            return;
        }
        // For wizard, handle special charging sequence
        if (attacker.name.toLowerCase() === 'wizard') {
            console.log("\uD83E\uDDD9 Wizard attack detected, starting charging sequence");
            this.handleWizardAttack(attacker, allUnits);
            return;
        }
        // Create standard projectile for other units
        var projectile = new Projectile_1.Projectile(this, {
            startX: startPos.x,
            startY: startPos.y - 20,
            targetX: targetPos.x,
            targetY: targetPos.y - 20,
            texture: textureKey,
            frame: undefined,
            speed: 600,
            scale: projectileScale
        });
        this.projectiles.push(projectile);
    };
    MainScene.prototype.createWizardProjectile = function (attacker, target, startPos, targetPos) {
        var _this = this;
        console.log("\uD83E\uDDD9 Creating wizard projectile from (".concat(startPos.x, ", ").concat(startPos.y, ") to (").concat(targetPos.x, ", ").concat(targetPos.y, ")"));
        console.log("\uD83E\uDDD9 Scene active: ".concat(this.scene.isActive(), ", cameras: ").concat(this.cameras ? 'OK' : 'NULL'));
        // Create a simple, guaranteed-visible projectile first
        console.log("\uD83E\uDDD9 Creating simple visible projectile for debugging");
        // Create a simple wizard projectile without complex animations
        console.log("\uD83E\uDDD9 Creating simple wizard projectile without animation conflicts");
        // Calculate angle for rotation
        var angle = Phaser.Math.Angle.Between(startPos.x, startPos.y, targetPos.x, targetPos.y);
        // Create a single sprite directly instead of using the complex Projectile class
        var projectileSprite = this.add.sprite(startPos.x, startPos.y - 20, 'wizard', 'Charge_1_1 #10.png');
        projectileSprite.setScale(1.5);
        projectileSprite.setRotation(angle);
        projectileSprite.setOrigin(0.5, 0.5);
        projectileSprite.setDepth(startPos.y + 100);
        // Disable texture smoothing to prevent artifacts
        if (projectileSprite.texture && projectileSprite.texture.source) {
            projectileSprite.texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        // Move the projectile manually
        var distance = Phaser.Math.Distance.Between(startPos.x, startPos.y, targetPos.x, targetPos.y);
        var duration = (distance / 400) * 1000; // speed of 400 pixels per second
        this.tweens.add({
            targets: projectileSprite,
            x: targetPos.x,
            y: targetPos.y - 20,
            duration: duration,
            ease: 'Linear',
            onComplete: function () {
                projectileSprite.destroy();
                console.log("\uD83D\uDCA5 Wizard projectile reached target");
                _this.createWizardImpactEffect(targetPos.x, targetPos.y - 20);
            }
        });
    };
    MainScene.prototype.createManualWizardProjectile = function (startPos, targetPos) {
        var _this = this;
        console.log("\uD83D\uDD27 Creating manual wizard projectile");
        // Create a bright, visible circle projectile
        var projectile = this.add.graphics();
        projectile.fillStyle(0x00ffff, 1.0); // Bright cyan
        projectile.fillCircle(0, 0, 20); // Large radius for visibility
        projectile.lineStyle(4, 0xffffff, 1.0); // Thick white outline
        projectile.strokeCircle(0, 0, 20);
        // Add inner core
        projectile.fillStyle(0xffffff, 0.8);
        projectile.fillCircle(0, 0, 10);
        projectile.x = startPos.x;
        projectile.y = startPos.y - 20;
        projectile.setDepth(9999); // Very high depth
        console.log("\uD83D\uDD27 Manual projectile created at (".concat(projectile.x, ", ").concat(projectile.y, ") with depth ").concat(projectile.depth));
        // Calculate travel time
        var distance = Phaser.Math.Distance.Between(startPos.x, startPos.y, targetPos.x, targetPos.y);
        var travelTime = Math.max(1000, (distance / 200) * 1000); // Slower for visibility
        // Animate to target
        this.tweens.add({
            targets: projectile,
            x: targetPos.x,
            y: targetPos.y - 20,
            duration: travelTime,
            ease: 'Linear',
            onUpdate: function () {
                // Rotate while moving
                projectile.rotation += 0.1;
            },
            onComplete: function () {
                console.log("\uD83D\uDD27 Manual projectile reached target");
                projectile.destroy();
                _this.createWizardImpactEffect(targetPos.x, targetPos.y - 20);
            }
        });
        console.log("\uD83D\uDD27 Manual projectile animation started, travel time: ".concat(travelTime, "ms"));
    };
    MainScene.prototype.handleWizardAttack = function (attacker, allUnits) {
        var _this = this;
        var _a;
        console.log("\uD83E\uDDD9 Wizard ".concat(attacker.name, " starting charging sequence"));
        console.log("\uD83E\uDDD9 Attacker details:", { id: attacker.id, position: attacker.position, health: attacker.health });
        console.log("\uD83E\uDDD9 handleWizardAttack CALLED! Scene active: ".concat(this.scene.isActive()));
        console.log("\uD83E\uDDD9 Unit sprites map size: ".concat(this.unitSprites.size));
        // Find the target first
        if (!attacker.position)
            return;
        var isPlayerUnit = ((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.players.some(function (p) {
            return p.units.some(function (u) { return u.id === attacker.id; });
        })) || false;
        var enemies = allUnits.filter(function (u) {
            var _a, _b;
            var isEnemy = isPlayerUnit ?
                (_a = _this.gameState) === null || _a === void 0 ? void 0 : _a.enemyUnits.some(function (e) { return e.id === u.id; }) :
                (_b = _this.gameState) === null || _b === void 0 ? void 0 : _b.players.some(function (p) { return p.units.some(function (pu) { return pu.id === u.id; }); });
            return isEnemy && u.status !== 'dead' && u.position;
        });
        if (enemies.length === 0)
            return;
        // Find closest enemy
        var closestEnemy = null;
        var closestDistance = Infinity;
        for (var _i = 0, enemies_2 = enemies; _i < enemies_2.length; _i++) {
            var enemy = enemies_2[_i];
            if (!enemy.position)
                continue;
            var distance = Math.abs(enemy.position.x - attacker.position.x) +
                Math.abs(enemy.position.y - attacker.position.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        if (!closestEnemy || !closestEnemy.position)
            return;
        // Start the charging animation and delayed projectile launch
        var attackerSprite = this.unitSprites.get(attacker.id);
        if (attackerSprite) {
            this.startWizardChargingAnimation(attackerSprite, attacker, closestEnemy, allUnits);
        }
    };
    MainScene.prototype.startWizardChargingAnimation = function (attackerSprite, attacker, target, allUnits) {
        var _this = this;
        console.log("\uD83D\uDD2E Starting wizard charging animation for ".concat(attacker.name));
        // Get wizard attack frames
        var wizardTextureKey = attacker.name.toLowerCase();
        if (!this.textures.exists(wizardTextureKey)) {
            console.error("Wizard texture ".concat(wizardTextureKey, " not found"));
            console.log("Available textures:", this.textures.list);
            return;
        }
        var frameNames = this.textures.get(wizardTextureKey).getFrameNames();
        console.log("\uD83D\uDD2E All frame names for wizard (first 20):", frameNames.slice(0, 20));
        var attackFrames = frameNames.filter(function (frame) {
            return frame.toLowerCase().includes('attack');
        });
        // Sort attack frames to get proper order
        attackFrames.sort(function (frameA, frameB) {
            var extractFrameInfo = function (frameName) {
                var match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
                if (match) {
                    var mainFrame = parseInt(match[2], 10);
                    var subFrame = match[3] ? parseInt(match[3], 10) : 0;
                    return { mainFrame: mainFrame, subFrame: subFrame };
                }
                var fallbackMatch = frameName.match(/(\d+)/);
                if (fallbackMatch) {
                    return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
                }
                return { mainFrame: Infinity, subFrame: Infinity };
            };
            var infoA = extractFrameInfo(frameA);
            var infoB = extractFrameInfo(frameB);
            if (infoA.mainFrame === infoB.mainFrame) {
                return infoA.subFrame - infoB.subFrame;
            }
            return infoA.mainFrame - infoB.mainFrame;
        });
        if (attackFrames.length < 9) {
            console.error("Not enough attack frames for wizard charging animation (need at least 9)");
            return;
        }
        console.log("\uD83D\uDD2E Total attack frames found: ".concat(attackFrames.length));
        console.log("\uD83D\uDD2E All attack frames:", attackFrames);
        // Calculate total animation duration first
        var totalFrames = attackFrames.length;
        var frameRate = 8;
        var animationDuration = (totalFrames / frameRate) * 1000; // Convert to milliseconds
        console.log("\uD83C\uDFAC Starting complete wizard attack animation sequence");
        console.log("\u23F1\uFE0F Full attack animation will take ".concat(animationDuration, "ms (").concat(totalFrames, " frames at ").concat(frameRate, "fps)"));
        // Play wizard sound effect at start of animation
        if (this.sound.get('wizardSound')) {
            this.sound.play('wizardSound', { volume: 0.6 });
        }
        // Create charging effect around wizard for the duration of the animation
        this.createChargingEffect(attackerSprite, animationDuration + 100);
        // Create the complete attack animation using ALL attack frames
        var fullAttackAnimKey = "wizard_full_attack_".concat(attacker.id);
        if (!this.anims.exists(fullAttackAnimKey)) {
            this.anims.create({
                key: fullAttackAnimKey,
                frames: this.anims.generateFrameNames(wizardTextureKey, {
                    frames: attackFrames // Use ALL attack frames
                }),
                frameRate: frameRate, // Consistent frame rate
                repeat: 0 // Play once
            });
        }
        // Play the full attack animation
        attackerSprite.play(fullAttackAnimKey);
        // Launch projectile AFTER the complete animation finishes
        this.time.delayedCall(animationDuration + 100, function () {
            console.log("\uD83D\uDE80 LAUNCHING WIZARD PROJECTILE AFTER ANIMATION COMPLETE!");
            // Get world positions
            var startPos = _this.grid.gridToWorld(attacker.position.x, attacker.position.y);
            var targetPos = _this.grid.gridToWorld(target.position.x, target.position.y);
            // Create the wizard projectile
            _this.createWizardProjectile(attacker, target, startPos, targetPos);
        });
    };
    MainScene.prototype.createChargingEffect = function (wizardSprite, duration) {
        if (duration === void 0) { duration = 3000; }
        console.log("\u2728 Creating charging effect around wizard for ".concat(duration, "ms"));
        // Create a charging circle that grows and pulses around the wizard
        var chargingCircle = this.add.circle(wizardSprite.x, wizardSprite.y - 10, 10, 0x4444ff, 0.3);
        chargingCircle.setDepth(wizardSprite.depth + 1);
        // Create particle effect for charging
        var particles = this.add.particles(wizardSprite.x, wizardSprite.y - 10, 'wizard', {
            frame: 'Charge_1_1 #10.png', // Use existing charge frame as particle
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0.8, end: 0 },
            speed: { min: 20, max: 40 },
            lifespan: 800,
            quantity: 2,
            frequency: 100
        });
        particles.setDepth(wizardSprite.depth + 2);
        // Animate charging circle
        this.tweens.add({
            targets: chargingCircle,
            radius: { from: 10, to: 25 },
            alpha: { from: 0.3, to: 0.8 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Store effects to clean them up later
        wizardSprite.chargingEffects = {
            circle: chargingCircle,
            particles: particles
        };
        // Clean up charging effects after the specified duration
        this.time.delayedCall(duration, function () {
            if (wizardSprite.chargingEffects) {
                wizardSprite.chargingEffects.circle.destroy();
                wizardSprite.chargingEffects.particles.destroy();
                wizardSprite.chargingEffects = null;
            }
        });
    };
    MainScene.prototype.createBlueOrbProjectile = function (attacker, target, allUnits) {
        console.log("\uD83D\uDD35 Creating blue orb projectile from ".concat(attacker.name, " to ").concat(target.name));
        console.log("\uD83C\uDFAF Attacker position:", attacker.position, "Target position:", target.position);
        console.log("\uD83D\uDD35 createBlueOrbProjectile CALLED! Time: ".concat(Date.now()));
        console.log("\uD83D\uDD35 Scene active: ".concat(this.scene.isActive(), ", Cameras: ").concat(this.cameras.main ? 'OK' : 'NULL'));
        console.log("\uD83D\uDD35 Current projectiles count: ".concat(this.projectiles.length));
        if (!attacker.position || !target.position) {
            console.error("\u274C Missing positions - Attacker: ".concat(attacker.position, ", Target: ").concat(target.position));
            return;
        }
        // Get world positions
        var startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
        var targetPos = this.grid.gridToWorld(target.position.x, target.position.y);
        console.log("\uD83D\uDE80 Orb traveling from (".concat(startPos.x, ", ").concat(startPos.y, ") to (").concat(targetPos.x, ", ").concat(targetPos.y, ")"));
        // Create container for the orb and all its effects
        try {
            var orbContainer = this.add.container(startPos.x, startPos.y - 20);
            orbContainer.setDepth(1000); // High depth to ensure visibility
            console.log("\u2728 Orb container created at depth ".concat(orbContainer.depth));
            this.createOrbVisualEffects(orbContainer, startPos, targetPos, attacker, allUnits);
        }
        catch (error) {
            console.error("\u274C Failed to create orb container:", error);
            // Fallback to standard wizard projectile
            var startPos_1 = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
            var targetPos_1 = this.grid.gridToWorld(target.position.x, target.position.y);
            this.createWizardProjectile(attacker, target, startPos_1, targetPos_1);
            return;
        }
    };
    MainScene.prototype.createOrbVisualEffects = function (orbContainer, startPos, targetPos, attacker, allUnits) {
        var _this = this;
        try {
            // Create multiple orb layers for visual depth - made larger and more visible
            var outerGlow = this.add.circle(0, 0, 35, 0x0066ff, 0.3);
            var middleRing = this.add.circle(0, 0, 25, 0x3388ff, 0.6);
            var innerOrb = this.add.circle(0, 0, 18, 0x88ccff, 0.9);
            var core = this.add.circle(0, 0, 12, 0xaaccff, 1.0);
            var center = this.add.circle(0, 0, 6, 0xffffff, 1.0);
            // Add bright outline for better visibility
            var outline = this.add.graphics();
            outline.lineStyle(3, 0xffffff, 0.8);
            outline.strokeCircle(0, 0, 30);
            console.log("\u2728 Created orb layers with improved visibility");
            // Add all layers to container
            orbContainer.add([outerGlow, middleRing, innerOrb, core, center, outline]);
            // Create pulsing animation for each layer
            this.tweens.add({
                targets: outerGlow,
                scaleX: { from: 1, to: 1.3 },
                scaleY: { from: 1, to: 1.3 },
                alpha: { from: 0.2, to: 0.4 },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: [middleRing, innerOrb],
                scaleX: { from: 1, to: 1.1 },
                scaleY: { from: 1, to: 1.1 },
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: [core, center],
                scaleX: { from: 1, to: 1.2 },
                scaleY: { from: 1, to: 1.2 },
                duration: 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            // Animate outline
            this.tweens.add({
                targets: outline,
                alpha: { from: 0.3, to: 1 },
                duration: 350,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            // Add rotation to make it more dynamic
            this.tweens.add({
                targets: orbContainer,
                rotation: { from: 0, to: Math.PI * 2 },
                duration: 1000,
                repeat: -1,
                ease: 'Linear'
            });
            // Create particle trail system
            var trailParticles_1;
            try {
                // Try to use wizard texture for particles
                if (this.textures.exists('wizard')) {
                    trailParticles_1 = this.add.particles(0, 0, 'wizard', {
                        frame: 'Charge_1_1 #10.png', // Use wizard charge frame as particle
                        scale: { start: 0.1, end: 0 },
                        alpha: { start: 0.8, end: 0 },
                        tint: [0x3388ff, 0x88ccff, 0xaaccff],
                        speed: { min: 20, max: 40 },
                        lifespan: 800,
                        quantity: 3,
                        frequency: 50,
                        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 15), quantity: 2 }
                    });
                    console.log("\uD83C\uDF86 Created wizard particle trail");
                }
                else {
                    console.warn("\u26A0\uFE0F Wizard texture not found, skipping particle trail");
                }
            }
            catch (error) {
                console.error("\u274C Failed to create particle trail:", error);
            }
            if (trailParticles_1) {
                trailParticles_1.setDepth(orbContainer.depth - 1);
                trailParticles_1.startFollow(orbContainer);
            }
            // Create target indicator at destination to show where the explosion will be
            var targetIndicator_1 = this.add.graphics();
            targetIndicator_1.lineStyle(2, 0x3388ff, 0.4);
            targetIndicator_1.strokeCircle(targetPos.x, targetPos.y - 20, 80); // Show the damage radius
            targetIndicator_1.setDepth(targetPos.y - 10);
            // Pulse the target indicator
            this.tweens.add({
                targets: targetIndicator_1,
                alpha: { from: 0.2, to: 0.6 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            // Calculate travel time based on distance
            var distance = Phaser.Math.Distance.Between(startPos.x, startPos.y, targetPos.x, targetPos.y);
            var travelTime = Math.max(1000, distance * 2); // Minimum 1 second, dramatic timing
            console.log("\u23F1\uFE0F Orb will travel for ".concat(travelTime, "ms over distance ").concat(distance, " pixels"));
            // Animate orb to target with smooth curve
            this.tweens.add({
                targets: orbContainer,
                x: targetPos.x,
                y: targetPos.y - 20,
                duration: travelTime,
                ease: 'Power2.easeOut',
                onComplete: function () {
                    console.log("\uD83D\uDCA5 Blue orb reached target at (".concat(targetPos.x, ", ").concat(targetPos.y, ")"));
                    // Stop particle trail
                    if (trailParticles_1) {
                        trailParticles_1.destroy();
                    }
                    // Remove target indicator
                    targetIndicator_1.destroy();
                    // Create explosion at impact point
                    _this.createWizardImpactEffect(targetPos.x, targetPos.y - 20);
                    // Destroy orb container
                    orbContainer.destroy();
                }
            });
            // Add a subtle trail effect by scaling the orb as it travels
            this.tweens.add({
                targets: orbContainer,
                scaleX: { from: 0.8, to: 1.2 },
                scaleY: { from: 0.8, to: 1.2 },
                duration: travelTime * 0.5,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
        catch (error) {
            console.error("\u274C Error creating orb visual effects:", error);
            // Fallback to simple projectile if visual effects fail
            // If no target found, skip projectile creation
            var target = allUnits.find(function (u) { return u.position && u.status !== 'dead' && u.id !== attacker.id; });
            if (target && target.position && attacker.position) {
                var startPos_2 = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
                var targetPos_2 = this.grid.gridToWorld(target.position.x, target.position.y);
                this.createWizardProjectile(attacker, target, startPos_2, targetPos_2);
            }
        }
    };
    MainScene.prototype.handleRangedUnitAttack = function (unit) {
        var _a, _b;
        console.log("\uD83C\uDFAF *** HANDLE RANGED UNIT ATTACK CALLED *** for ".concat(unit.name, " (").concat(unit.id, ")"));
        if (!unit.position) {
            console.log("\u274C Unit has no position");
            return;
        }
        // Get all units for target finding
        var allPlayerUnits = ((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.players.flatMap(function (p) { return p.units; })) || [];
        var allEnemyUnits = ((_b = this.gameState) === null || _b === void 0 ? void 0 : _b.enemyUnits) || [];
        var allUnits = __spreadArray(__spreadArray([], allPlayerUnits, true), allEnemyUnits, true);
        if (unit.name.toLowerCase() === 'wizard') {
            console.log("\uD83E\uDDD9 Creating Charge_1_X projectile for wizard");
            this.createProjectileForAttack(unit, allUnits);
        }
        else {
            console.log("\uD83C\uDFF9 Creating standard projectile for ".concat(unit.name));
            this.createProjectileForAttack(unit, allUnits);
        }
    };
    MainScene.prototype.createWizardImpactEffect = function (x, y) {
        console.log("\uD83D\uDCA5 Creating wizard impact at (".concat(x, ", ").concat(y, ")"));
        // Create a single-target magical impact effect
        var impactCircle = this.add.circle(x, y, 15, 0x3388ff, 0.8);
        impactCircle.setDepth(y + 100);
        // Single impact flash
        this.tweens.add({
            targets: impactCircle,
            radius: 25,
            alpha: 0,
            duration: 400,
            ease: 'Power2.Out',
            onComplete: function () {
                impactCircle.destroy();
            }
        });
        // Add magical particles using wizard texture if available
        if (this.textures.exists('wizard')) {
            var particles_1 = this.add.particles(x, y, 'wizard', {
                frame: 'Charge_1_1 #10.png',
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                tint: [0x3388ff, 0x88ccff, 0xaaccff],
                speed: { min: 100, max: 200 },
                lifespan: 800,
                quantity: 12,
                frequency: -1, // Burst all at once
                emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 10), quantity: 12 }
            });
            particles_1.setDepth(y + 102);
            particles_1.explode(12);
            // Clean up particles after animation
            this.time.delayedCall(1000, function () {
                if (particles_1 && particles_1.active)
                    particles_1.destroy();
            });
        }
        else {
            var _loop_5 = function (i) {
                var particle = this_5.add.circle(x, y, 4, 0x88ccff);
                particle.setDepth(y + 101);
                var angle = (Math.PI * 2 * i) / 12;
                var distance = 60 + Math.random() * 40;
                this_5.tweens.add({
                    targets: particle,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0,
                    duration: 800,
                    ease: 'Power2.Out',
                    onComplete: function () {
                        particle.destroy();
                    }
                });
            };
            var this_5 = this;
            // Fallback to simple circle particles
            for (var i = 0; i < 12; i++) {
                _loop_5(i);
            }
        }
        // Add a small camera shake for impact
        this.cameras.main.shake(200, 0.008);
    };
    MainScene.prototype.createBlueOrbExplosion = function (x, y, attacker, allUnits) {
        var _this = this;
        console.log("\uD83D\uDCA5 Creating enhanced blue orb explosion at (".concat(x, ", ").concat(y, ")"));
        // Create main explosion container
        var explosionContainer = this.add.container(x, y);
        explosionContainer.setDepth(y + 200);
        // Define the damage radius
        var damageRadius = 80;
        // FIRST: Create damage radius indicator BEFORE explosion
        var radiusIndicator = this.add.graphics();
        radiusIndicator.lineStyle(3, 0x88ccff, 0.8);
        radiusIndicator.strokeCircle(x, y, damageRadius);
        radiusIndicator.setDepth(y + 195);
        // Pulse the radius indicator
        this.tweens.add({
            targets: radiusIndicator,
            alpha: { from: 0.3, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });
        // Create inner filled radius preview
        var radiusFill = this.add.circle(x, y, damageRadius, 0x3388ff, 0.15);
        radiusFill.setDepth(y + 194);
        // Animate radius fill
        this.tweens.add({
            targets: radiusFill,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 0.3 },
            duration: 400,
            ease: 'Power2.easeOut'
        });
        // Create multiple explosion rings with different animations
        var rings = [];
        var ringColors = [0xffffff, 0xaaccff, 0x88ccff, 0x3388ff, 0x0066ff];
        for (var i = 0; i < 5; i++) {
            var ring = this.add.circle(0, 0, 5, ringColors[i], 0.9 - (i * 0.15));
            rings.push(ring);
            explosionContainer.add(ring);
        }
        // Animate rings expanding outward in sequence
        rings.forEach(function (ring, index) {
            _this.tweens.add({
                targets: ring,
                scaleX: { from: 0.2, to: 12 + (index * 1.5) },
                scaleY: { from: 0.2, to: 12 + (index * 1.5) },
                alpha: { from: 0.9, to: 0 },
                duration: 1000 + (index * 100),
                ease: 'Power2.easeOut',
                delay: index * 60
            });
        });
        // Create inner flash effect
        var flash = this.add.circle(0, 0, 20, 0xffffff, 1);
        explosionContainer.add(flash);
        this.tweens.add({
            targets: flash,
            scaleX: { from: 0.1, to: 6 },
            scaleY: { from: 0.1, to: 6 },
            alpha: { from: 1, to: 0 },
            duration: 400,
            ease: 'Power3.easeOut'
        });
        // Create spectacular particle burst
        var burstParticles = this.add.particles(x, y, '__DEFAULT', {
            scale: { start: 1.0, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0x0066ff, 0x3388ff, 0x88ccff, 0xaaccff, 0xffffff],
            speed: { min: 150, max: 350 },
            lifespan: 1500,
            quantity: 30,
            frequency: -1, // Burst all at once
            emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 8), quantity: 30 }
        });
        burstParticles.setDepth(y + 202);
        burstParticles.explode(30);
        // Create secondary particle ring
        var ringParticles = this.add.particles(x, y, '__DEFAULT', {
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x3388ff, 0x88ccff],
            speed: { min: 80, max: 150 },
            lifespan: 1000,
            quantity: 20,
            frequency: -1,
            emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 25), quantity: 20 }
        });
        ringParticles.setDepth(y + 201);
        ringParticles.explode(20);
        // Add screen shake for impact
        this.cameras.main.shake(300, 0.015);
        // Calculate area damage after showing the radius
        this.calculateAreaDamage(x, y, damageRadius, attacker, allUnits);
        // Clean up explosion effects
        this.time.delayedCall(1200, function () {
            explosionContainer.destroy();
            radiusIndicator.destroy();
            radiusFill.destroy();
        });
        this.time.delayedCall(2000, function () {
            if (burstParticles && burstParticles.active)
                burstParticles.destroy();
            if (ringParticles && ringParticles.active)
                ringParticles.destroy();
        });
    };
    MainScene.prototype.calculateAreaDamage = function (explosionX, explosionY, radius, attacker, allUnits) {
        var _this = this;
        var _a;
        console.log("\u26A1 Calculating area damage from wizard explosion");
        // Find all enemy units within the blast radius
        var isPlayerUnit = ((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.players.some(function (p) {
            return p.units.some(function (u) { return u.id === attacker.id; });
        })) || false;
        var enemies = allUnits.filter(function (u) {
            var _a, _b;
            var isEnemy = isPlayerUnit ?
                (_a = _this.gameState) === null || _a === void 0 ? void 0 : _a.enemyUnits.some(function (e) { return e.id === u.id; }) :
                (_b = _this.gameState) === null || _b === void 0 ? void 0 : _b.players.some(function (p) { return p.units.some(function (pu) { return pu.id === u.id; }); });
            return isEnemy && u.status !== 'dead' && u.position;
        });
        var affectedEnemies = [];
        for (var _i = 0, enemies_3 = enemies; _i < enemies_3.length; _i++) {
            var enemy = enemies_3[_i];
            if (!enemy.position)
                continue;
            var enemyPos = this.grid.gridToWorld(enemy.position.x, enemy.position.y);
            var distance = Phaser.Math.Distance.Between(explosionX, explosionY, enemyPos.x, enemyPos.y);
            if (distance <= radius) {
                affectedEnemies.push(enemy);
                console.log("\uD83C\uDFAF Enemy ".concat(enemy.name, " caught in blast (distance: ").concat(distance.toFixed(1), ")"));
            }
        }
        // Apply damage to all affected enemies
        if (affectedEnemies.length > 0) {
            console.log("\uD83D\uDC80 Wizard explosion affecting ".concat(affectedEnemies.length, " enemies"));
            // Create damage indicators for affected enemies with cascade effect
            affectedEnemies.forEach(function (enemy, index) {
                if (enemy.position) {
                    var enemyWorldPos_1 = _this.grid.gridToWorld(enemy.position.x, enemy.position.y);
                    // Delayed damage indicators for dramatic cascade effect
                    _this.time.delayedCall(index * 80, function () {
                        _this.createDamageIndicator(enemyWorldPos_1.x, enemyWorldPos_1.y, attacker.damage || 4, 'magic');
                        // Add individual hit effect on each enemy
                        var enemyHitEffect = _this.add.circle(enemyWorldPos_1.x, enemyWorldPos_1.y, 12, 0x88ccff, 0.7);
                        enemyHitEffect.setDepth(enemyWorldPos_1.y + 50);
                        _this.tweens.add({
                            targets: enemyHitEffect,
                            scaleX: { from: 0.3, to: 4 },
                            scaleY: { from: 0.3, to: 4 },
                            alpha: { from: 0.7, to: 0 },
                            duration: 500,
                            ease: 'Power2.easeOut',
                            onComplete: function () { return enemyHitEffect.destroy(); }
                        });
                        // Add small particle burst on each enemy hit
                        var hitParticles = _this.add.particles(enemyWorldPos_1.x, enemyWorldPos_1.y, '__DEFAULT', {
                            scale: { start: 0.4, end: 0 },
                            alpha: { start: 0.8, end: 0 },
                            tint: [0x88ccff, 0xaaccff],
                            speed: { min: 30, max: 80 },
                            lifespan: 600,
                            quantity: 8,
                            frequency: -1
                        });
                        hitParticles.setDepth(enemyWorldPos_1.y + 51);
                        hitParticles.explode(8);
                        _this.time.delayedCall(800, function () {
                            if (hitParticles && hitParticles.active)
                                hitParticles.destroy();
                        });
                    });
                }
            });
        }
    };
    MainScene.prototype.createDamageIndicator = function (x, y, damage, type) {
        if (type === void 0) { type = 'physical'; }
        // Create damage text with appropriate color
        var color = type === 'magic' ? '#88ccff' : type === 'heal' ? '#4CAF50' : '#ffffff';
        var text = this.add.text(x, y - 20, "-".concat(Math.round(damage)), {
            fontSize: '16px',
            color: color,
            stroke: '#000000',
            strokeThickness: 2,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(y + 100);
        // Animate damage text
        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.2 },
            duration: 1000,
            ease: 'Power2.easeOut',
            onComplete: function () { return text.destroy(); }
        });
    };
    MainScene.prototype.createHolyProjectileEffect = function (startX, startY, targetX, targetY) {
        var _this = this;
        // Create a simple holy light effect for priest attacks
        var light = this.add.circle(startX, startY - 20, 8, 0xffff88, 1);
        light.setDepth(startY + 100);
        // Add glow effect
        var glow = this.add.circle(startX, startY - 20, 12, 0xffff88, 0.3);
        glow.setDepth(startY + 99);
        // Animate to target
        var duration = 400;
        this.tweens.add({
            targets: [light, glow],
            x: targetX,
            y: targetY - 20,
            duration: duration,
            ease: 'Power2',
            onComplete: function () {
                // Create impact effect
                var impact = _this.add.circle(targetX, targetY - 20, 20, 0xffff88, 0.5);
                impact.setDepth(targetY + 101);
                _this.tweens.add({
                    targets: impact,
                    scale: 2,
                    alpha: 0,
                    duration: 200,
                    onComplete: function () {
                        impact.destroy();
                    }
                });
                light.destroy();
                glow.destroy();
            }
        });
    };
    MainScene.prototype.sendHoverPosition = function (gridPos) {
        var _a;
        var currentTime = this.time.now;
        // Debounce hover events to avoid spam
        if (currentTime - this.lastHoverSentTime < this.hoverDebounceTime) {
            return;
        }
        // Only send if position actually changed
        if (gridPos && this.lastHoverPosition &&
            this.lastHoverPosition.x === gridPos.x &&
            this.lastHoverPosition.y === gridPos.y) {
            return;
        }
        this.lastHoverPosition = gridPos ? { x: gridPos.x, y: gridPos.y } : null;
        this.lastHoverSentTime = currentTime;
        // Send hover event via GameContext
        if ((_a = window.gameContext) === null || _a === void 0 ? void 0 : _a.socket) {
            console.log('Sending cell-hover event:', gridPos);
            window.gameContext.socket.emit('cell-hover', gridPos);
        }
        else {
            console.log('No socket available to send hover event');
        }
    };
    MainScene.prototype.updatePlayerHover = function (playerId, playerName, position, playerColor) {
        this.grid.updatePlayerHover(playerId, playerName, position, playerColor);
    };
    MainScene.prototype.showSellZone = function () {
        if (this.sellZone)
            return; // Already visible
        // Create sell zone container
        this.sellZone = this.add.container(this.cameras.main.width - 150, this.cameras.main.height / 2);
        this.sellZone.setDepth(1900); // Below drag preview but above most things
        // Create background panel with gradient
        var zoneHeight = 200;
        var zoneWidth = 120;
        var bg = this.add.graphics();
        // Draw gradient background
        bg.fillGradientStyle(0xff0000, 0xff0000, 0xcc0000, 0xcc0000, 0.8, 0.9, 0.7, 0.8);
        bg.fillRoundedRect(-zoneWidth / 2, -zoneHeight / 2, zoneWidth, zoneHeight, 16);
        // Draw border
        bg.lineStyle(3, 0xffffff, 0.8);
        bg.strokeRoundedRect(-zoneWidth / 2, -zoneHeight / 2, zoneWidth, zoneHeight, 16);
        // Add pulsing border effect
        var pulsingBorder = this.add.graphics();
        pulsingBorder.lineStyle(3, 0xff6666, 0.6);
        pulsingBorder.strokeRoundedRect(-zoneWidth / 2, -zoneHeight / 2, zoneWidth, zoneHeight, 16);
        this.tweens.add({
            targets: pulsingBorder,
            alpha: { from: 0.3, to: 0.8 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Add sell icon
        var sellIcon = this.add.text(0, -40, '💰', {
            fontSize: '48px'
        });
        sellIcon.setOrigin(0.5);
        // Add text
        var sellText = this.add.text(0, 10, 'SELL', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        });
        sellText.setOrigin(0.5);
        var refundText = this.add.text(0, 40, '75% Refund', {
            fontSize: '14px',
            color: '#ffff88',
            stroke: '#000000',
            strokeThickness: 2
        });
        refundText.setOrigin(0.5);
        // Add all elements to container
        this.sellZone.add([bg, pulsingBorder, sellIcon, sellText, refundText]);
        // Animate sell zone sliding in
        this.sellZone.x = this.cameras.main.width + 100;
        this.tweens.add({
            targets: this.sellZone,
            x: this.cameras.main.width - 100,
            duration: 300,
            ease: 'Power2.easeOut'
        });
    };
    MainScene.prototype.hideSellZone = function () {
        var _this = this;
        if (!this.sellZone)
            return;
        // Animate sell zone sliding out
        this.tweens.add({
            targets: this.sellZone,
            x: this.cameras.main.width + 100,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: function () {
                if (_this.sellZone) {
                    _this.sellZone.destroy();
                    _this.sellZone = null;
                }
            }
        });
        this.isOverSellZone = false;
    };
    MainScene.prototype.checkSellZoneHover = function (pointerX, pointerY) {
        if (!this.sellZone) {
            this.isOverSellZone = false;
            return;
        }
        // Check if pointer is over sell zone
        var sellZoneBounds = {
            x: this.sellZone.x - 60,
            y: this.sellZone.y - 100,
            width: 120,
            height: 200
        };
        var wasOverSellZone = this.isOverSellZone;
        this.isOverSellZone = pointerX >= sellZoneBounds.x &&
            pointerX <= sellZoneBounds.x + sellZoneBounds.width &&
            pointerY >= sellZoneBounds.y &&
            pointerY <= sellZoneBounds.y + sellZoneBounds.height;
        // Update visual feedback when entering/leaving sell zone
        if (this.isOverSellZone !== wasOverSellZone) {
            if (this.isOverSellZone) {
                // Entering sell zone - make it glow more
                this.tweens.add({
                    targets: this.sellZone,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    ease: 'Power2.easeOut'
                });
                // Update drag preview to show sell indication
                if (this.dragPreview && this.draggedUnit) {
                    var unitStats = this.getUnitStats(this.draggedUnit.name);
                    var refundAmount = Math.floor(((unitStats === null || unitStats === void 0 ? void 0 : unitStats.cost) || 0) * 0.75);
                    // Add refund amount text to drag preview if not already there
                    var refundIndicator = this.add.text(0, -40, "+".concat(refundAmount, "g"), {
                        fontSize: '16px',
                        color: '#ffff00',
                        stroke: '#000000',
                        strokeThickness: 3,
                        fontStyle: 'bold'
                    });
                    refundIndicator.setOrigin(0.5);
                    refundIndicator.setName('refundIndicator');
                    this.dragPreview.add(refundIndicator);
                }
            }
            else {
                // Leaving sell zone
                this.tweens.add({
                    targets: this.sellZone,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2.easeOut'
                });
                // Remove refund indicator from drag preview
                if (this.dragPreview) {
                    var refundIndicator = this.dragPreview.getByName('refundIndicator');
                    if (refundIndicator) {
                        refundIndicator.destroy();
                    }
                }
            }
        }
    };
    MainScene.prototype.sellUnit = function (unitId) {
        var _a;
        // Use the game context to emit sell event
        if ((_a = window.gameContext) === null || _a === void 0 ? void 0 : _a.socket) {
            window.gameContext.socket.emit('sell-unit', unitId);
            // Play sell sound if available
            if (this.sound.get('purchase')) {
                this.sound.play('purchase', { volume: 0.7, rate: 1.2 });
            }
        }
    };
    MainScene.prototype.getUnitStats = function (unitName) {
        var _a;
        // Find unit stats from shop units or a predefined list
        if ((_a = this.gameState) === null || _a === void 0 ? void 0 : _a.shopUnits) {
            return this.gameState.shopUnits.find(function (u) { return u.name === unitName; }) || null;
        }
        return null;
    };
    MainScene.prototype.showDragInstruction = function () {
        if (this.dragInstruction)
            return;
        // Create instruction container at top of screen
        this.dragInstruction = this.add.container(this.cameras.main.centerX, 100);
        this.dragInstruction.setDepth(2100);
        // Create background
        var bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(-200, -30, 400, 60, 12);
        // Create instruction text
        var instructionText = this.add.text(0, 0, '🎯 Drag to reposition  |  💰 Drop in red zone to sell (75% refund)', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        instructionText.setOrigin(0.5);
        this.dragInstruction.add([bg, instructionText]);
        // Fade in animation
        this.dragInstruction.setAlpha(0);
        this.tweens.add({
            targets: this.dragInstruction,
            alpha: 1,
            duration: 300,
            ease: 'Power2.easeOut'
        });
    };
    MainScene.prototype.hideDragInstruction = function () {
        var _this = this;
        if (!this.dragInstruction)
            return;
        this.tweens.add({
            targets: this.dragInstruction,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: function () {
                if (_this.dragInstruction) {
                    _this.dragInstruction.destroy();
                    _this.dragInstruction = null;
                }
            }
        });
    };
    MainScene.prototype.createDragShadow = function (unitSprite) {
        // Create an ellipse shadow beneath the unit
        this.dragShadow = this.add.ellipse(unitSprite.x, unitSprite.y + 30, 50, 20, 0x000000, 0.3);
        this.dragShadow.setDepth(unitSprite.depth - 1);
        // Add pulsing animation to the shadow
        this.tweens.add({
            targets: this.dragShadow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    };
    MainScene.prototype.destroyDragShadow = function () {
        if (this.dragShadow) {
            this.tweens.killTweensOf(this.dragShadow);
            this.dragShadow.destroy();
            this.dragShadow = null;
        }
    };
    // TEST FUNCTION: Force create a wizard projectile for debugging
    MainScene.prototype.testWizardProjectile = function () {
        console.log("\uD83E\uDDEA TEST: Creating test wizard projectile");
        // Create a dummy wizard unit
        var testWizard = {
            id: 'test-wizard',
            name: 'wizard',
            playerId: 'test',
            position: { x: 5, y: 4 },
            status: 'attacking',
            cost: 5,
            damage: 4,
            attackSpeed: 1,
            attackType: 'Magical',
            health: 10,
            maxHealth: 10,
            range: 3,
            priority: 1,
            movementSpeed: 1,
            armorType: 'Unarmored',
            targetId: 'test-target',
            attackCooldown: 0,
            buffs: [],
            debuffs: []
        };
        // Create a dummy target
        var testTarget = {
            id: 'test-target',
            name: 'knight',
            playerId: 'enemy',
            position: { x: 8, y: 4 },
            status: 'idle',
            cost: 3,
            damage: 3,
            attackSpeed: 1,
            attackType: 'Physical',
            health: 12,
            maxHealth: 12,
            range: 1,
            priority: 2,
            movementSpeed: 1,
            armorType: 'Heavy',
            attackCooldown: 0,
            buffs: [],
            debuffs: []
        };
        console.log("\uD83E\uDDEA Testing wizard projectile creation");
        console.log("\uD83E\uDDEA Is wizard ranged: ".concat(this.isRangedUnit(testWizard)));
        console.log("\uD83E\uDDEA Wizard texture exists: ".concat(this.textures.exists('wizard')));
        try {
            this.handleWizardAttack(testWizard, [testWizard, testTarget]);
        }
        catch (error) {
            console.error("\uD83E\uDDEA Test wizard attack failed:", error);
            // Fallback to direct wizard projectile creation
            var startPos = this.grid.gridToWorld(testWizard.position.x, testWizard.position.y);
            var targetPos = this.grid.gridToWorld(testTarget.position.x, testTarget.position.y);
            this.createWizardProjectile(testWizard, testTarget, startPos, targetPos);
        }
    };
    // Global function accessible from browser console to add a wizard for testing
    MainScene.prototype.addTestWizard = function () {
        var _this = this;
        console.log("\uD83E\uDDD9 Adding test wizard to player roster");
        if (!this.gameState) {
            console.error("\u274C No game state available");
            return;
        }
        var currentPlayer = this.gameState.players.find(function (p) { return p.id === _this.currentPlayerId; });
        if (!currentPlayer) {
            console.error("\u274C Current player not found");
            return;
        }
        // Create a wizard unit
        var wizardUnit = {
            id: "test-wizard-".concat(Date.now()),
            name: 'Wizard',
            playerId: this.currentPlayerId || '',
            health: 18,
            maxHealth: 18,
            damage: 4,
            speed: 38,
            status: 'idle',
            position: null,
            buffs: [],
            cost: 12,
            attackSpeed: 0.25,
            attackType: 'Magical',
            range: 50,
            priority: 3,
            movementSpeed: 38,
            armorType: 'Unarmored',
            attackCooldown: 0,
            debuffs: []
        };
        // Add to player's units
        currentPlayer.units.push(wizardUnit);
        console.log("\uD83E\uDDD9 Added wizard to player units. Total units: ".concat(currentPlayer.units.length));
        return wizardUnit;
    };
    MainScene.prototype.testWizardProjectile = function () {
        console.log('🧙 Testing wizard projectile creation...');
        // Create a fake wizard unit
        var wizard = {
            id: 'test-wizard',
            name: 'Wizard',
            playerId: 'test',
            health: 10,
            maxHealth: 10,
            damage: 5,
            speed: 1,
            status: 'attacking',
            position: { x: 5, y: 4 },
            buffs: []
        };
        // Create a fake target
        var target = {
            id: 'test-target',
            name: 'Enemy',
            playerId: 'enemy',
            health: 10,
            maxHealth: 10,
            damage: 3,
            speed: 1,
            status: 'idle',
            position: { x: 10, y: 4 },
            buffs: []
        };
        // Get world positions
        var startPos = this.grid.gridToWorld(wizard.position.x, wizard.position.y);
        var targetPos = this.grid.gridToWorld(target.position.x, target.position.y);
        // Create the wizard projectile
        this.createWizardProjectile(wizard, target, startPos, targetPos);
    };
    MainScene.prototype.testWizardChargeFrame = function () {
        var _this = this;
        console.log('🧙 Testing wizard Charge frame rendering...');
        if (!this.textures.exists('wizard')) {
            console.error('❌ Wizard texture not loaded!');
            return;
        }
        var wizardTexture = this.textures.get('wizard');
        var frameNames = wizardTexture.getFrameNames();
        var chargeFrames = frameNames.filter(function (f) { return f.includes('Charge_1_'); });
        console.log("Found ".concat(chargeFrames.length, " Charge frames:"), chargeFrames);
        // Create sprites for each Charge frame
        chargeFrames.forEach(function (frame, index) {
            var x = 100 + (index * 80);
            var y = 200;
            // Create using Projectile class
            var projectile = new Projectile_1.Projectile(_this, {
                startX: x,
                startY: y,
                targetX: x + 200,
                targetY: y,
                texture: 'wizard',
                frame: frame,
                speed: 50, // Very slow so we can see it
                scale: 3.0
            });
            _this.projectiles.push(projectile);
            // Also create a static sprite to compare
            var staticSprite = _this.add.sprite(x, y + 100, 'wizard', frame);
            staticSprite.setScale(3.0);
            staticSprite.setDepth(10000);
            // Add text label
            var label = _this.add.text(x, y + 150, frame.split(' ')[0], {
                fontSize: '12px',
                color: '#ffffff'
            });
            label.setOrigin(0.5);
            console.log("Created test sprites for frame: ".concat(frame));
        });
    };
    MainScene.prototype.testResponsiveBehavior = function () {
        console.log('🧑‍💻 === RESPONSIVE BEHAVIOR TEST ===');
        var testSizes = [
            { width: 320, height: 568, name: 'Mobile Portrait (iPhone SE)' },
            { width: 375, height: 667, name: 'Mobile Portrait (iPhone 8)' },
            { width: 414, height: 896, name: 'Mobile Portrait (iPhone 11)' },
            { width: 768, height: 1024, name: 'Tablet Portrait (iPad)' },
            { width: 1024, height: 768, name: 'Tablet Landscape' },
            { width: 1366, height: 768, name: 'Laptop' },
            { width: 1920, height: 1080, name: 'Desktop HD' }
        ];
        var currentSize = {
            width: this.cameras.main.width,
            height: this.cameras.main.height
        };
        console.log('💻 Current screen:', currentSize);
        console.log('🎮 Current grid state:', {
            cellSize: this.cellSize,
            gridPosition: { x: this.grid.x, y: this.grid.y },
            gridBounds: this.grid.getBounds()
        });
        // Check if grid is visible and not overlapping with UI
        var gridBounds = this.grid.getBounds();
        var topHUDHeight = 80;
        var bottomHUDHeight = 140;
        var isGridFullyVisible = gridBounds.top >= topHUDHeight &&
            gridBounds.bottom <= (currentSize.height - bottomHUDHeight);
        console.log('✅ Grid visibility check:', {
            fullyVisible: isGridFullyVisible,
            topClearance: gridBounds.top - topHUDHeight,
            bottomClearance: (currentSize.height - bottomHUDHeight) - gridBounds.bottom
        });
        // Check background coverage
        var bg = this.children.getByName('background');
        if (bg) {
            console.log('🌆 Background coverage:', {
                displaySize: { width: bg.displayWidth, height: bg.displayHeight },
                screenSize: { width: this.scale.gameSize.width, height: this.scale.gameSize.height },
                coveragePercent: {
                    width: (bg.displayWidth / this.scale.gameSize.width * 100).toFixed(1) + '%',
                    height: (bg.displayHeight / this.scale.gameSize.height * 100).toFixed(1) + '%'
                },
                fullCoverage: bg.displayWidth >= this.scale.gameSize.width && bg.displayHeight >= this.scale.gameSize.height
            });
        }
        // Calculate what cell size would be for each test size
        console.log('\n📱 Cell size calculations for different screens:');
        testSizes.forEach(function (size) {
            var topHUD = 80;
            var bottomHUD = 140;
            var totalUI = topHUD + bottomHUD;
            var buffer = 20;
            var availableHeight = size.height - totalUI - buffer;
            var availableWidth = size.width - (buffer * 2);
            var cellByWidth = availableWidth / 20;
            var cellByHeight = availableHeight / 8;
            var cellSize = Math.min(cellByWidth, cellByHeight);
            cellSize = Math.max(15, Math.min(60, cellSize));
            var gridWidth = cellSize * 20;
            var gridHeight = cellSize * 8;
            console.log("\uD83D\uDCF1 ".concat(size.name, ":"), {
                screenSize: "".concat(size.width, "x").concat(size.height),
                cellSize: Math.round(cellSize),
                gridSize: "".concat(Math.round(gridWidth), "x").concat(Math.round(gridHeight)),
                fitsScreen: gridWidth <= availableWidth && gridHeight <= availableHeight
            });
        });
        console.log('\nℹ️ To test different sizes, resize your browser window or use device emulation mode (F12 > Toggle device toolbar)');
        return true;
    };
    // Dragon special attack handlers
    MainScene.prototype.handleDragonRise = function (dragonId) {
        console.log("\uD83D\uDC09 Client handling dragon ".concat(dragonId, " rising for special attacks"));
        var dragonSprite = this.unitSprites.get(dragonId);
        if (dragonSprite) {
            // Play rise animation
            dragonSprite.playAnimation('rise');
            // Add slight elevation effect
            this.tweens.add({
                targets: dragonSprite,
                y: dragonSprite.y - 3,
                duration: 2000,
                ease: 'Power2.easeOut'
            });
        }
    };
    MainScene.prototype.handleDragonSpecialAttack = function (dragonId, targetPosition, affectedUnits) {
        var _this = this;
        console.log("\uD83D\uDD25 Client handling dragon ".concat(dragonId, " special attack at position"), targetPosition);
        // Get world position for the damage area
        var worldPos = this.grid.gridToWorld(targetPosition.x, targetPosition.y);
        // Create red circle damage indicator
        var damageIndicator = this.add.graphics();
        damageIndicator.setDepth(1000); // High depth to appear above everything
        // Draw red circle with fade in/out effect
        var radius = 40; // Same as server-side area radius
        damageIndicator.lineStyle(3, 0xFF0000, 0.8);
        damageIndicator.fillStyle(0xFF0000, 0.2);
        damageIndicator.fillCircle(worldPos.x, worldPos.y, radius);
        damageIndicator.strokeCircle(worldPos.x, worldPos.y, radius);
        // Add pulsing effect
        this.tweens.add({
            targets: damageIndicator,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: 1,
            ease: 'Power2.easeInOut',
            onComplete: function () {
                damageIndicator.destroy();
            }
        });
        // Flash affected units
        affectedUnits.forEach(function (unitId) {
            var unitSprite = _this.unitSprites.get(unitId);
            if (unitSprite) {
                _this.tweens.add({
                    targets: unitSprite,
                    alpha: 0.3,
                    duration: 200,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Power2.easeInOut'
                });
            }
        });
    };
    return MainScene;
}(Phaser.Scene));
exports.default = MainScene;
