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
Object.defineProperty(exports, "__esModule", { value: true });
var Phaser = __importStar(require("phaser"));
var Grid = /** @class */ (function (_super) {
    __extends(Grid, _super);
    function Grid(scene, x, y, gridWidth, gridHeight, cellSize) {
        var _this = _super.call(this, scene, x, y) || this;
        _this.cells = [];
        _this.gridState = [];
        _this.highlightRect = null;
        _this.isGridVisible = true;
        _this.playerHoverRects = new Map();
        _this.gridBackground = null;
        _this.gridWidth = gridWidth;
        _this.gridHeight = gridHeight;
        _this.cellSize = cellSize;
        _this.createGrid();
        scene.add.existing(_this);
        return _this;
    }
    Grid.prototype.createGrid = function () {
        var offsetX = -(this.gridWidth * this.cellSize) / 2;
        var offsetY = -(this.gridHeight * this.cellSize) / 2;
        console.log('=== GRID CREATION ===');
        console.log('Grid total size:', {
            pixelWidth: this.gridWidth * this.cellSize,
            pixelHeight: this.gridHeight * this.cellSize,
            cellSize: this.cellSize,
            position: { x: this.x, y: this.y }
        });
        // No grid background overlay - let the main scene background show through
        // Create grid cells
        for (var y = 0; y < this.gridHeight; y++) {
            this.cells[y] = [];
            this.gridState[y] = [];
            for (var x = 0; x < this.gridWidth; x++) {
                var cellX = offsetX + x * this.cellSize + this.cellSize / 2;
                var cellY = offsetY + y * this.cellSize + this.cellSize / 2;
                // Create cell rectangle
                var cell = this.scene.add.rectangle(cellX, cellY, this.cellSize - 2, this.cellSize - 2, 0x1a1a2e, 0.3);
                cell.setStrokeStyle(1, 0x0f3460, 0.5);
                this.cells[y][x] = cell;
                this.add(cell);
                // Initialize grid state
                this.gridState[y][x] = {
                    x: x,
                    y: y,
                    occupied: false
                };
            }
        }
        // Create highlight rectangle with subtle styling
        this.highlightRect = this.scene.add.rectangle(0, 0, this.cellSize - 2, this.cellSize - 2, 0xFFFFFF, 0.1);
        this.highlightRect.setStrokeStyle(2, 0xFFFFFF, 0.6);
        this.highlightRect.setVisible(false);
        this.add(this.highlightRect);
        // Clear any leftover player hover rectangles
        this.clearAllPlayerHovers();
    };
    Grid.prototype.updateGrid = function (gridState) {
        var _a;
        this.gridState = gridState;
        // Update visual state of cells
        for (var y = 0; y < this.gridHeight; y++) {
            for (var x = 0; x < this.gridWidth; x++) {
                var cell = this.cells[y][x];
                var state = (_a = gridState[y]) === null || _a === void 0 ? void 0 : _a[x];
                if (state === null || state === void 0 ? void 0 : state.occupied) {
                    // Use a different color for occupied cells, not green (green is for highlighting)
                    cell.setFillStyle(0x1a1a2e, 0.5); // Slightly more opaque to show occupation
                }
                else {
                    cell.setFillStyle(0x1a1a2e, 0.3);
                }
            }
        }
    };
    Grid.prototype.worldToGrid = function (worldX, worldY) {
        var localX = worldX - this.x;
        var localY = worldY - this.y;
        var offsetX = -(this.gridWidth * this.cellSize) / 2;
        var offsetY = -(this.gridHeight * this.cellSize) / 2;
        var gridX = Math.floor((localX - offsetX) / this.cellSize);
        var gridY = Math.floor((localY - offsetY) / this.cellSize);
        return {
            x: Phaser.Math.Clamp(gridX, 0, this.gridWidth - 1),
            y: Phaser.Math.Clamp(gridY, 0, this.gridHeight - 1)
        };
    };
    Grid.prototype.gridToWorld = function (gridX, gridY) {
        var offsetX = -(this.gridWidth * this.cellSize) / 2;
        var offsetY = -(this.gridHeight * this.cellSize) / 2;
        var worldX = this.x + offsetX + gridX * this.cellSize + this.cellSize / 2;
        var worldY = this.y + offsetY + gridY * this.cellSize + this.cellSize / 2;
        return { x: worldX, y: worldY };
    };
    Grid.prototype.isValidPlacement = function (gridX, gridY, currentPlayerId) {
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        var cell = this.gridState[gridY][gridX];
        // If cell is not occupied, it's valid
        if (!cell.occupied) {
            return true;
        }
        // If cell is occupied but by the same player, it's valid (can swap units)
        if (currentPlayerId && cell.playerId === currentPlayerId) {
            return true;
        }
        // Otherwise, cell is occupied by another player - invalid
        return false;
    };
    Grid.prototype.highlightCell = function (gridX, gridY, currentPlayerId) {
        if (!this.highlightRect)
            return;
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            this.highlightRect.setVisible(false);
            return;
        }
        var worldPos = this.gridToWorld(gridX, gridY);
        var localX = worldPos.x - this.x;
        var localY = worldPos.y - this.y;
        this.highlightRect.setPosition(localX, localY);
        this.highlightRect.setVisible(true);
        // Use subtle white highlighting that adapts to validity (NEW VERSION!)
        console.log('🔧 NEW GRID HIGHLIGHTING ACTIVE!');
        var isValid = this.isValidPlacement(gridX, gridY, currentPlayerId);
        if (isValid) {
            this.highlightRect.setStrokeStyle(2, 0x81C784, 0.8); // Subtle green for valid
            this.highlightRect.setFillStyle(0x81C784, 0.1);
        }
        else {
            this.highlightRect.setStrokeStyle(2, 0xFF8A65, 0.8); // Subtle orange for invalid
            this.highlightRect.setFillStyle(0xFF8A65, 0.1);
        }
    };
    Grid.prototype.clearHighlight = function () {
        if (this.highlightRect) {
            this.highlightRect.setVisible(false);
        }
    };
    Grid.prototype.setGridVisible = function (visible) {
        this.isGridVisible = visible;
        this.setVisible(visible);
    };
    Grid.prototype.toggleGridVisibility = function () {
        this.setGridVisible(!this.isGridVisible);
    };
    Grid.prototype.getGridVisibility = function () {
        return this.isGridVisible;
    };
    Grid.prototype.updatePlayerHover = function (playerId, playerName, position, playerColor) {
        // Disabled: Don't show other players' highlighting
        return;
    };
    Grid.prototype.clearAllPlayerHovers = function () {
        for (var _i = 0, _a = this.playerHoverRects; _i < _a.length; _i++) {
            var _b = _a[_i], playerId = _b[0], rect = _b[1];
            rect.destroy();
        }
        this.playerHoverRects.clear();
    };
    Grid.prototype.updateBackgroundSize = function () {
        // Grid background removed - no longer needed
    };
    return Grid;
}(Phaser.GameObjects.Container));
exports.default = Grid;
