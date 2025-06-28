import * as Phaser from 'phaser';
import { GridCell, Position } from '../../types/game';

export default class Grid extends Phaser.GameObjects.Container {
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private cells: Phaser.GameObjects.Rectangle[][] = [];
  private gridState: GridCell[][] = [];
  private highlightRect: Phaser.GameObjects.Rectangle | null = null;
  private isGridVisible: boolean = true;
  private playerHoverRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private gridBackground: Phaser.GameObjects.Rectangle | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gridWidth: number,
    gridHeight: number,
    cellSize: number
  ) {
    super(scene, x, y);
    
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellSize = cellSize;
    
    this.createGrid();
    scene.add.existing(this);
  }

  private createGrid() {
    const offsetX = -(this.gridWidth * this.cellSize) / 2;
    const offsetY = -(this.gridHeight * this.cellSize) / 2;
    
    console.log('=== GRID CREATION ===');
    console.log('Grid total size:', {
      pixelWidth: this.gridWidth * this.cellSize,
      pixelHeight: this.gridHeight * this.cellSize,
      cellSize: this.cellSize,
      position: { x: this.x, y: this.y }
    });
    
    // No grid background overlay - let the main scene background show through
    
    // Create grid cells
    for (let y = 0; y < this.gridHeight; y++) {
      this.cells[y] = [];
      this.gridState[y] = [];
      
      for (let x = 0; x < this.gridWidth; x++) {
        const cellX = offsetX + x * this.cellSize + this.cellSize / 2;
        const cellY = offsetY + y * this.cellSize + this.cellSize / 2;
        
        // Create cell rectangle
        const cell = this.scene.add.rectangle(
          cellX,
          cellY,
          this.cellSize - 2,
          this.cellSize - 2,
          0x1a1a2e,
          0.3
        );
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
    this.highlightRect = this.scene.add.rectangle(
      0,
      0,
      this.cellSize - 2,
      this.cellSize - 2,
      0xFFFFFF,
      0.1
    );
    this.highlightRect.setStrokeStyle(2, 0xFFFFFF, 0.6);
    this.highlightRect.setVisible(false);
    this.add(this.highlightRect);
    
    // Clear any leftover player hover rectangles
    this.clearAllPlayerHovers();
  }

  updateGrid(gridState: GridCell[][]) {
    this.gridState = gridState;
    
    // Update visual state of cells
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.cells[y][x];
        const state = gridState[y]?.[x];
        
        if (state?.occupied) {
          // Use a different color for occupied cells, not green (green is for highlighting)
          cell.setFillStyle(0x1a1a2e, 0.5); // Slightly more opaque to show occupation
        } else {
          cell.setFillStyle(0x1a1a2e, 0.3);
        }
      }
    }
  }

  worldToGrid(worldX: number, worldY: number): Position {
    const localX = worldX - this.x;
    const localY = worldY - this.y;
    
    const offsetX = -(this.gridWidth * this.cellSize) / 2;
    const offsetY = -(this.gridHeight * this.cellSize) / 2;
    
    const gridX = Math.floor((localX - offsetX) / this.cellSize);
    const gridY = Math.floor((localY - offsetY) / this.cellSize);
    
    
    return {
      x: Phaser.Math.Clamp(gridX, 0, this.gridWidth - 1),
      y: Phaser.Math.Clamp(gridY, 0, this.gridHeight - 1)
    };
  }

  gridToWorld(gridX: number, gridY: number): Position {
    const offsetX = -(this.gridWidth * this.cellSize) / 2;
    const offsetY = -(this.gridHeight * this.cellSize) / 2;
    
    const worldX = this.x + offsetX + gridX * this.cellSize + this.cellSize / 2;
    const worldY = this.y + offsetY + gridY * this.cellSize + this.cellSize / 2;
    
    return { x: worldX, y: worldY };
  }

  isValidPlacement(gridX: number, gridY: number, currentPlayerId?: string): boolean {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }
    
    const cell = this.gridState[gridY][gridX];
    
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
  }

  highlightCell(gridX: number, gridY: number, currentPlayerId?: string) {
    if (!this.highlightRect) return;
    
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      this.highlightRect.setVisible(false);
      return;
    }
    
    const worldPos = this.gridToWorld(gridX, gridY);
    const localX = worldPos.x - this.x;
    const localY = worldPos.y - this.y;
    
    this.highlightRect.setPosition(localX, localY);
    this.highlightRect.setVisible(true);
    
    // Use subtle white highlighting that adapts to validity (NEW VERSION!)
    console.log('🔧 NEW GRID HIGHLIGHTING ACTIVE!');
    const isValid = this.isValidPlacement(gridX, gridY, currentPlayerId);
    if (isValid) {
      this.highlightRect.setStrokeStyle(2, 0x81C784, 0.8); // Subtle green for valid
      this.highlightRect.setFillStyle(0x81C784, 0.1);
    } else {
      this.highlightRect.setStrokeStyle(2, 0xFF8A65, 0.8); // Subtle orange for invalid
      this.highlightRect.setFillStyle(0xFF8A65, 0.1);
    }
  }

  clearHighlight() {
    if (this.highlightRect) {
      this.highlightRect.setVisible(false);
    }
  }

  setGridVisible(visible: boolean) {
    this.isGridVisible = visible;
    this.setVisible(visible);
  }

  toggleGridVisibility() {
    this.setGridVisible(!this.isGridVisible);
  }

  getGridVisibility(): boolean {
    return this.isGridVisible;
  }

  updatePlayerHover(playerId: string, playerName: string, position: Position | null, playerColor: string) {
    // Disabled: Don't show other players' highlighting
    return;
  }

  clearAllPlayerHovers() {
    for (const [playerId, rect] of this.playerHoverRects) {
      rect.destroy();
    }
    this.playerHoverRects.clear();
  }

  updateBackgroundSize() {
    // Grid background removed - no longer needed
  }
}