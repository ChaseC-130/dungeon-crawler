import * as Phaser from 'phaser';
import { Unit } from '../../types/game';

export default class UnitTooltip extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private ownerText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private padding: number = 12;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    
    // Create background
    this.background = scene.add.rectangle(0, 0, 200, 120, 0x000000, 0.9);
    this.background.setStrokeStyle(2, 0xffffff, 1);
    this.add(this.background);
    
    // Create text elements
    this.nameText = scene.add.text(0, -40, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
    
    this.ownerText = scene.add.text(0, -20, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffdd00'
    });
    this.ownerText.setOrigin(0.5);
    this.add(this.ownerText);
    
    this.statsText = scene.add.text(0, 10, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    });
    this.statsText.setOrigin(0.5);
    this.add(this.statsText);
    
    // Set depth to be on top
    this.setDepth(10000);
    
    // Initially hidden
    this.setVisible(false);
    
    scene.add.existing(this);
  }

  showForUnit(unit: Unit, ownerName: string, x: number, y: number) {
    // Update texts
    this.nameText.setText(unit.name);
    this.ownerText.setText(`Owner: ${ownerName}`);
    
    // Format stats
    const statsLines = [
      `HP: ${unit.health}/${unit.maxHealth}`,
      `Damage: ${unit.damage}`,
      `Attack Speed: ${unit.attackSpeed.toFixed(1)}`,
      `Range: ${unit.range}`
    ];
    this.statsText.setText(statsLines.join('\n'));
    
    // Calculate bounds for all text elements
    const maxWidth = Math.max(
      this.nameText.width,
      this.ownerText.width,
      this.statsText.width
    ) + this.padding * 2;
    
    const totalHeight = 
      this.nameText.height + 
      this.ownerText.height + 
      this.statsText.height + 
      this.padding * 2 + 20; // Extra spacing between texts
    
    // Update background size
    this.background.setSize(maxWidth, totalHeight);
    
    // Position tooltip (offset to avoid covering the unit)
    this.setPosition(x, y - 100);
    
    // Keep tooltip within screen bounds
    const bounds = this.scene.cameras.main.getBounds();
    const tooltipBounds = this.getBounds();
    
    if (tooltipBounds.right > bounds.right) {
      this.x -= (tooltipBounds.right - bounds.right) + 10;
    }
    if (tooltipBounds.left < bounds.left) {
      this.x += (bounds.left - tooltipBounds.left) + 10;
    }
    if (tooltipBounds.top < bounds.top) {
      this.y += (bounds.top - tooltipBounds.top) + 10;
    }
    
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}