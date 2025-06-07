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
    
    // Change color based on validity
    if (this.isValidPlacement(gridX, gridY, currentPlayerId)) {
      this.highlightRect.setStrokeStyle(3, 0x4CAF50, 1);
    } else {
      this.highlightRect.setStrokeStyle(3, 0xF44336, 1);
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
    // Remove existing hover rect for this player
    if (this.playerHoverRects.has(playerId)) {
      const existingRect = this.playerHoverRects.get(playerId)!;
      existingRect.destroy();
      this.playerHoverRects.delete(playerId);
    }

    // If position is null, just clear the hover
    if (!position) return;

    // Validate position
    if (position.x < 0 || position.x >= this.gridWidth || position.y < 0 || position.y >= this.gridHeight) {
      return;
    }

    // Create new hover rect for this player
    const worldPos = this.gridToWorld(position.x, position.y);
    const localX = worldPos.x - this.x;
    const localY = worldPos.y - this.y;

    // Parse player color (should be hex like "#FF0000")
    let color = 0x888888; // Default gray
    try {
      if (playerColor.startsWith('#')) {
        color = parseInt(playerColor.slice(1), 16);
      }
    } catch (e) {
      console.warn('Invalid player color:', playerColor);
    }

    const hoverRect = this.scene.add.rectangle(
      localX,
      localY,
      this.cellSize - 2,
      this.cellSize - 2,
      color,
      0
    );
    hoverRect.setStrokeStyle(2, color, 0.8);
    
    // Add player name text
    const nameText = this.scene.add.text(localX, localY - this.cellSize/2 - 10, playerName, {
      fontSize: '10px',
      color: playerColor,
      stroke: '#000000',
      strokeThickness: 1
    });
    nameText.setOrigin(0.5);

    // Store both rect and text in a container for easy management
    const container = this.scene.add.container(0, 0, [hoverRect, nameText]);
    this.add(container);
    
    // Store reference (we'll store the container as the rect for simplicity)
    this.playerHoverRects.set(playerId, container as any);
  }

  clearAllPlayerHovers() {
    for (const [playerId, rect] of this.playerHoverRects) {
      rect.destroy();
    }
    this.playerHoverRects.clear();
  }
}