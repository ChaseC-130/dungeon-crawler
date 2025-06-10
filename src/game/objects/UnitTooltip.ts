import * as Phaser from 'phaser';
import { Unit } from '../../types/game';

export default class UnitTooltip extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private ownerText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private upgradesText: Phaser.GameObjects.Text;
  private upgradeIcons: Phaser.GameObjects.Container;
  private padding: number = 12;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    
    // Create background
    this.background = scene.add.rectangle(0, 0, 200, 120, 0x000000, 0.9);
    this.background.setStrokeStyle(2, 0xffffff, 1);
    this.add(this.background);
    
    // Create text elements - increased font sizes for better readability
    this.nameText = scene.add.text(0, -50, '', {
      fontSize: '26px',  // Increased from 20px
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
    
    this.ownerText = scene.add.text(0, -25, '', {
      fontSize: '22px',  // Increased from 18px
      fontFamily: 'Arial',
      color: '#ffdd00'
    });
    this.ownerText.setOrigin(0.5);
    this.add(this.ownerText);
    
    this.statsText = scene.add.text(0, 10, '', {
      fontSize: '20px',  // Increased from 16px
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    });
    this.statsText.setOrigin(0.5);
    this.add(this.statsText);
    
    this.upgradesText = scene.add.text(0, 55, '', {
      fontSize: '18px',  // Increased from 14px
      fontFamily: 'Arial',
      color: '#FFD700',
      align: 'center'
    });
    this.upgradesText.setOrigin(0.5);
    this.add(this.upgradesText);
    
    // Create upgrade icons container
    this.upgradeIcons = scene.add.container(0, 85);  // Moved down due to larger text
    this.add(this.upgradeIcons);
    
    // Set depth to be on top
    this.setDepth(10000);
    
    // Initially hidden
    this.setVisible(false);
    
    scene.add.existing(this);
  }

  showForUnit(unit: Unit, ownerName: string, x: number, y: number, showOwner: boolean = true) {
    // Update texts
    this.nameText.setText(unit.name);
    
    // Only show owner info for placed units
    if (showOwner) {
      this.ownerText.setText(`Owner: ${ownerName}`);
      this.ownerText.setVisible(true);
      // Position stats text below owner text
      this.statsText.setY(10);
      this.upgradesText.setY(55);
      this.upgradeIcons.setY(85);
    } else {
      this.ownerText.setVisible(false);
      // Position stats text closer to name when no owner info
      this.statsText.setY(-15);
      this.upgradesText.setY(25);
      this.upgradeIcons.setY(55);
    }
    
    // Calculate base stats and buffs
    const baseStats = this.calculateBaseStats(unit);
    const buffedStats = this.calculateBuffedStats(unit, baseStats);
    
    // Format stats with green +X indicators for buffed values
    let statsLines: string[];
    if (unit.name && unit.name.toLowerCase() === 'priest') {
      // Special display for priests - show healing instead of damage
      const healSpeedDisplay = buffedStats.attackSpeed > baseStats.attackSpeed ? 
        `${unit.attackSpeed.toFixed(1)} (+${(unit.attackSpeed - baseStats.attackSpeed).toFixed(1)})/sec` :
        `${unit.attackSpeed.toFixed(1)}/sec`;
      
      statsLines = [
        `HP: ${unit.health}/${buffedStats.maxHealth > baseStats.maxHealth ? 
          `${unit.maxHealth} (+${unit.maxHealth - baseStats.maxHealth})` : 
          unit.maxHealth}`,
        `Healing: 3.75% of target's max HP`,
        `Heal Speed: ${healSpeedDisplay}`,
        `Range: ${unit.range}`
      ];
    } else {
      const damageDisplay = buffedStats.damage > baseStats.damage ? 
        `${unit.damage} (+${unit.damage - baseStats.damage})` : 
        `${unit.damage}`;
      const attackSpeedDisplay = buffedStats.attackSpeed > baseStats.attackSpeed ? 
        `${unit.attackSpeed.toFixed(1)} (+${(unit.attackSpeed - baseStats.attackSpeed).toFixed(1)})` :
        `${unit.attackSpeed.toFixed(1)}`;
      const healthDisplay = buffedStats.maxHealth > baseStats.maxHealth ? 
        `${unit.maxHealth} (+${unit.maxHealth - baseStats.maxHealth})` : 
        `${unit.maxHealth}`;
      
      statsLines = [
        `HP: ${unit.health}/${healthDisplay}`,
        `Damage: ${damageDisplay}`,
        `Attack Speed: ${attackSpeedDisplay}`,
        `Range: ${unit.range}`
      ];
    }
    this.statsText.setText(statsLines.join('\n'));
    
    // Format upgrades/buffs and create icons
    this.updateUpgradesDisplay(unit);
    
    // Calculate bounds for all text elements
    const iconsWidth = this.upgradeIcons.list.length > 0 ? (this.upgradeIcons.list.length * 32) + ((this.upgradeIcons.list.length - 1) * 4) : 0;
    const maxWidth = Math.max(
      this.nameText.width,
      showOwner ? this.ownerText.width : 0,
      this.statsText.width,
      this.upgradesText.width,
      iconsWidth
    ) + this.padding * 2;
    
    const iconsHeight = this.upgradeIcons.list.length > 0 ? 32 + 10 : 0; // Icon height + spacing
    const totalHeight = 
      this.nameText.height + 
      (showOwner ? this.ownerText.height : 0) + 
      this.statsText.height + 
      this.upgradesText.height +
      iconsHeight +
      this.padding * 2 + 30; // Extra spacing between texts
    
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

  private updateUpgradesDisplay(unit: Unit) {
    // Clear existing icons
    this.upgradeIcons.removeAll(true);
    
    const upgradeLines: string[] = [];
    if (unit.buffs && unit.buffs.length > 0) {
      upgradeLines.push('Upgrades:');
      
      unit.buffs.forEach((buff, index) => {
        const { upgradeName, upgradeDescription, iconKey } = this.getUpgradeInfo(buff);
        
        // Create upgrade icon if texture exists
        if (iconKey && this.scene.textures.exists(iconKey)) {
          const icon = this.scene.add.image(index * 36 - ((unit.buffs!.length - 1) * 18), 0, iconKey);
          icon.setScale(0.5); // Scale down from 64x64 to 32x32
          this.upgradeIcons.add(icon);
        }
        
        upgradeLines.push(`• ${upgradeName}`);
        if (upgradeDescription) {
          upgradeLines.push(`  ${upgradeDescription}`);
        }
      });
    }
    
    this.upgradesText.setText(upgradeLines.join('\n'));
  }

  private getUpgradeInfo(buff: any): { upgradeName: string, upgradeDescription: string, iconKey: string } {
    let upgradeName = '';
    let upgradeDescription = '';
    let iconKey = '';
    
    switch (buff.type) {
      case 'lifesteal':
        upgradeName = 'Vampiric Strike';
        upgradeDescription = `${(buff.value * 100).toFixed(0)}% lifesteal`;
        iconKey = 'vampiric_strike';
        break;
      case 'movementSpeed':
        upgradeName = 'Swift Boots';
        upgradeDescription = `+${(buff.value * 100).toFixed(0)}% speed`;
        iconKey = 'swift_boots';
        break;
      case 'health':
        upgradeName = 'Vitality Boost';
        upgradeDescription = `+${(buff.value * 100).toFixed(0)}% health`;
        iconKey = 'vitality_boost';
        break;
      case 'damage':
        upgradeName = 'Power Surge';
        upgradeDescription = `+${(buff.value * 100).toFixed(0)}% damage`;
        iconKey = 'power_surge';
        break;
      case 'attackSpeed':
        upgradeName = 'Rapid Strikes';
        upgradeDescription = `+${(buff.value * 100).toFixed(0)}% attack speed`;
        iconKey = 'rapid_strikes';
        break;
      case 'priority':
        upgradeName = buff.value > 0 ? 'Evasive Maneuvers' : 'Taunt';
        upgradeDescription = buff.value > 0 ? '+1 priority' : '-1 priority';
        iconKey = buff.value > 0 ? 'evasive_maneuvers' : 'taunt';
        break;
      case 'deathHeal':
        upgradeName = 'Final Gift';
        upgradeDescription = `${(buff.value * 100).toFixed(0)}% heal on death`;
        iconKey = 'final_gift';
        break;
      case 'deathExplosion':
        upgradeName = 'Explosive End';
        upgradeDescription = `${(buff.value * 100).toFixed(0)}% damage on death`;
        iconKey = 'explosive_end';
        break;
      case 'poison':
        upgradeName = 'Poison Blade';
        upgradeDescription = `${buff.value} poison damage/sec`;
        iconKey = 'poison_blade';
        break;
      case 'slowAura':
        upgradeName = 'Slowing Aura';
        upgradeDescription = `-${(buff.value * 100).toFixed(0)}% enemy attack speed`;
        iconKey = 'slowing_aura';
        break;
      default:
        upgradeName = buff.type;
        upgradeDescription = `Value: ${buff.value}`;
        iconKey = '';
    }
    
    return { upgradeName, upgradeDescription, iconKey };
  }

  private calculateBaseStats(unit: Unit): { damage: number, maxHealth: number, attackSpeed: number } {
    // This would ideally come from a unit configuration file
    // For now, we'll reverse-calculate from the current stats and buffs
    let baseDamage = unit.damage;
    let baseMaxHealth = unit.maxHealth;
    let baseAttackSpeed = unit.attackSpeed;
    
    if (unit.buffs) {
      unit.buffs.forEach(buff => {
        switch (buff.type) {
          case 'damage':
            baseDamage = Math.round(unit.damage / (1 + buff.value));
            break;
          case 'health':
            baseMaxHealth = Math.round(unit.maxHealth / (1 + buff.value));
            break;
          case 'attackSpeed':
            baseAttackSpeed = unit.attackSpeed / (1 + buff.value);
            break;
        }
      });
    }
    
    return { damage: baseDamage, maxHealth: baseMaxHealth, attackSpeed: baseAttackSpeed };
  }

  private calculateBuffedStats(unit: Unit, baseStats: { damage: number, maxHealth: number, attackSpeed: number }): { damage: number, maxHealth: number, attackSpeed: number } {
    return {
      damage: unit.damage,
      maxHealth: unit.maxHealth,
      attackSpeed: unit.attackSpeed
    };
  }
}