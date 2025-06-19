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
    
    // Create full-screen background for grid area
    // The background needs to be positioned relative to the grid container's position
    const sceneWidth = this.scene.cameras.main.width;
    const sceneHeight = this.scene.cameras.main.height;
    
    // Since the grid container is centered, we need to offset the background
    // to cover the entire screen from the container's perspective
    this.gridBackground = this.scene.add.rectangle(
      0,
      0,
      sceneWidth * 2, // Make it extra wide to ensure full coverage
      sceneHeight * 2, // Make it extra tall to ensure full coverage
      0x0a0a0f,
      0.8
    );
    this.gridBackground.setOrigin(0.5, 0.5); // Center origin
    this.add(this.gridBackground);
    this.sendToBack(this.gridBackground); // Ensure it's behind the grid cells
    
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
    
    // Create highlight rectangle
    this.highlightRect = this.scene.add.rectangle(
      0,
      0,
      this.cellSize - 2,
      this.cellSize - 2,
      0x4CAF50,
      0
    );
    this.highlightRect.setStrokeStyle(3, 0x4CAF50, 1);
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
          cell.setFillStyle(0x2E7D32, 0.2);
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
    // Disable all grid highlighting to remove green debug boxes during purchasing
    if (!this.highlightRect) return;
    
    // Always keep highlight hidden to remove green debug visualization
    this.highlightRect.setVisible(false);
    return;
    
    /* Original highlighting logic disabled:
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      this.highlightRect.setVisible(false);
      return;
    }
    
    const worldPos = this.gridToWorld(gridX, gridY);
    const localX = worldPos.x - this.x;
    const localY = worldPos.y - this.y;
    
    this.highlightRect.setPosition(localX, localY);
    this.highlightRect.setVisible(true);
    
    // Always use green highlighting for all players
    this.highlightRect.setStrokeStyle(3, 0x4CAF50, 1);
    */
  }

  clearHighlight() {
    if (this.highlightRect) {
      this.highlightRect.setVisible(false);
    }
  }

  setGridVisible(visible: boolean) {
    this.isGridVisible = visible;
    this.setVisible(visible);
    if (this.gridBackground) {
      this.gridBackground.setVisible(visible);
    }
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
    if (this.gridBackground) {
      const sceneWidth = this.scene.cameras.main.width;
      const sceneHeight = this.scene.cameras.main.height;
      // Make background extra large to ensure full coverage
      this.gridBackground.setSize(sceneWidth * 2, sceneHeight * 2);
      this.gridBackground.setPosition(0, 0); // Keep centered at container origin
    }
  }
}