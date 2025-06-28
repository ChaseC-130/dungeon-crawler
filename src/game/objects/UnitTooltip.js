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
var UnitTooltip = /** @class */ (function (_super) {
    __extends(UnitTooltip, _super);
    function UnitTooltip(scene) {
        var _this = _super.call(this, scene, 0, 0) || this;
        _this.padding = 12;
        // Create background
        _this.background = scene.add.rectangle(0, 0, 200, 120, 0x000000, 0.9);
        _this.background.setStrokeStyle(2, 0xffffff, 1);
        _this.add(_this.background);
        // Create text elements - increased font sizes for better readability
        _this.nameText = scene.add.text(0, -50, '', {
            fontSize: '26px', // Increased from 20px
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        _this.nameText.setOrigin(0.5);
        _this.add(_this.nameText);
        _this.ownerText = scene.add.text(0, -25, '', {
            fontSize: '22px', // Increased from 18px
            fontFamily: 'Arial',
            color: '#ffdd00'
        });
        _this.ownerText.setOrigin(0.5);
        _this.add(_this.ownerText);
        _this.statsText = scene.add.text(0, 10, '', {
            fontSize: '20px', // Increased from 16px
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        _this.statsText.setOrigin(0.5);
        _this.add(_this.statsText);
        _this.upgradesText = scene.add.text(0, 55, '', {
            fontSize: '18px', // Increased from 14px
            fontFamily: 'Arial',
            color: '#FFD700',
            align: 'center'
        });
        _this.upgradesText.setOrigin(0.5);
        _this.add(_this.upgradesText);
        // Create upgrade icons container
        _this.upgradeIcons = scene.add.container(0, 85); // Moved down due to larger text
        _this.add(_this.upgradeIcons);
        // Set depth to be on top
        _this.setDepth(10000);
        // Initially hidden
        _this.setVisible(false);
        scene.add.existing(_this);
        return _this;
    }
    UnitTooltip.prototype.showForUnit = function (unit, ownerName, x, y, showOwner) {
        if (showOwner === void 0) { showOwner = true; }
        // Update texts
        this.nameText.setText(unit.name);
        // Only show owner info for placed units
        if (showOwner) {
            this.ownerText.setText("Owner: ".concat(ownerName));
            this.ownerText.setVisible(true);
            // Position stats text below owner text
            this.statsText.setY(10);
            this.upgradesText.setY(55);
            this.upgradeIcons.setY(85);
        }
        else {
            this.ownerText.setVisible(false);
            // Position stats text closer to name when no owner info
            this.statsText.setY(-15);
            this.upgradesText.setY(25);
            this.upgradeIcons.setY(55);
        }
        // Calculate base stats and buffs
        var baseStats = this.calculateBaseStats(unit);
        var buffedStats = this.calculateBuffedStats(unit, baseStats);
        // Format stats with green +X indicators for buffed values
        var statsLines;
        if (unit.name && unit.name.toLowerCase() === 'priest') {
            // Special display for priests - show healing instead of damage
            var healSpeedDisplay = buffedStats.attackSpeed > baseStats.attackSpeed ?
                "".concat(unit.attackSpeed.toFixed(1), " (+").concat((unit.attackSpeed - baseStats.attackSpeed).toFixed(1), ")/sec") :
                "".concat(unit.attackSpeed.toFixed(1), "/sec");
            statsLines = [
                "HP: ".concat(unit.health, "/").concat(buffedStats.maxHealth > baseStats.maxHealth ?
                    "".concat(unit.maxHealth, " (+").concat(unit.maxHealth - baseStats.maxHealth, ")") :
                    unit.maxHealth),
                "Healing: 3.75% of target's max HP",
                "Heal Speed: ".concat(healSpeedDisplay),
                "Range: ".concat(unit.range)
            ];
        }
        else {
            var damageDisplay = buffedStats.damage > baseStats.damage ?
                "".concat(unit.damage, " (+").concat(unit.damage - baseStats.damage, ")") :
                "".concat(unit.damage);
            var attackSpeedDisplay = buffedStats.attackSpeed > baseStats.attackSpeed ?
                "".concat(unit.attackSpeed.toFixed(1), " (+").concat((unit.attackSpeed - baseStats.attackSpeed).toFixed(1), ")") :
                "".concat(unit.attackSpeed.toFixed(1));
            var healthDisplay = buffedStats.maxHealth > baseStats.maxHealth ?
                "".concat(unit.maxHealth, " (+").concat(unit.maxHealth - baseStats.maxHealth, ")") :
                "".concat(unit.maxHealth);
            statsLines = [
                "HP: ".concat(unit.health, "/").concat(healthDisplay),
                "Damage: ".concat(damageDisplay),
                "Attack Speed: ".concat(attackSpeedDisplay),
                "Range: ".concat(unit.range)
            ];
        }
        this.statsText.setText(statsLines.join('\n'));
        // Format upgrades/buffs and create icons
        this.updateUpgradesDisplay(unit);
        // Calculate bounds for all text elements
        var iconsWidth = this.upgradeIcons.list.length > 0 ? (this.upgradeIcons.list.length * 32) + ((this.upgradeIcons.list.length - 1) * 4) : 0;
        var maxWidth = Math.max(this.nameText.width, showOwner ? this.ownerText.width : 0, this.statsText.width, this.upgradesText.width, iconsWidth) + this.padding * 2;
        var iconsHeight = this.upgradeIcons.list.length > 0 ? 32 + 10 : 0; // Icon height + spacing
        var totalHeight = this.nameText.height +
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
        var bounds = this.scene.cameras.main.getBounds();
        var tooltipBounds = this.getBounds();
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
    };
    UnitTooltip.prototype.hide = function () {
        this.setVisible(false);
    };
    UnitTooltip.prototype.updateUpgradesDisplay = function (unit) {
        var _this = this;
        // Clear existing icons
        this.upgradeIcons.removeAll(true);
        var upgradeLines = [];
        if (unit.buffs && unit.buffs.length > 0) {
            upgradeLines.push('Upgrades:');
            unit.buffs.forEach(function (buff, index) {
                var _a = _this.getUpgradeInfo(buff), upgradeName = _a.upgradeName, upgradeDescription = _a.upgradeDescription, iconKey = _a.iconKey;
                // Create upgrade icon if texture exists
                if (iconKey && _this.scene.textures.exists(iconKey)) {
                    var icon = _this.scene.add.image(index * 36 - ((unit.buffs.length - 1) * 18), 0, iconKey);
                    icon.setScale(0.5); // Scale down from 64x64 to 32x32
                    _this.upgradeIcons.add(icon);
                }
                upgradeLines.push("\u2022 ".concat(upgradeName));
                if (upgradeDescription) {
                    upgradeLines.push("  ".concat(upgradeDescription));
                }
            });
        }
        this.upgradesText.setText(upgradeLines.join('\n'));
    };
    UnitTooltip.prototype.getUpgradeInfo = function (buff) {
        var upgradeName = '';
        var upgradeDescription = '';
        var iconKey = '';
        switch (buff.type) {
            case 'lifesteal':
                upgradeName = 'Vampiric Strike';
                upgradeDescription = "".concat((buff.value * 100).toFixed(0), "% lifesteal");
                iconKey = 'vampiric_strike';
                break;
            case 'movementSpeed':
                upgradeName = 'Swift Boots';
                upgradeDescription = "+".concat((buff.value * 100).toFixed(0), "% speed");
                iconKey = 'swift_boots';
                break;
            case 'health':
                upgradeName = 'Vitality Boost';
                upgradeDescription = "+".concat((buff.value * 100).toFixed(0), "% health");
                iconKey = 'vitality_boost';
                break;
            case 'damage':
                upgradeName = 'Power Surge';
                upgradeDescription = "+".concat((buff.value * 100).toFixed(0), "% damage");
                iconKey = 'power_surge';
                break;
            case 'attackSpeed':
                upgradeName = 'Rapid Strikes';
                upgradeDescription = "+".concat((buff.value * 100).toFixed(0), "% attack speed");
                iconKey = 'rapid_strikes';
                break;
            case 'priority':
                upgradeName = buff.value > 0 ? 'Evasive Maneuvers' : 'Taunt';
                upgradeDescription = buff.value > 0 ? '+1 priority' : '-1 priority';
                iconKey = buff.value > 0 ? 'evasive_maneuvers' : 'taunt';
                break;
            case 'deathHeal':
                upgradeName = 'Final Gift';
                upgradeDescription = "".concat((buff.value * 100).toFixed(0), "% heal on death");
                iconKey = 'final_gift';
                break;
            case 'deathExplosion':
                upgradeName = 'Explosive End';
                upgradeDescription = "".concat((buff.value * 100).toFixed(0), "% damage on death");
                iconKey = 'explosive_end';
                break;
            case 'poison':
                upgradeName = 'Poison Blade';
                upgradeDescription = "".concat(buff.value, " poison damage/sec");
                iconKey = 'poison_blade';
                break;
            case 'slowAura':
                upgradeName = 'Slowing Aura';
                upgradeDescription = "-".concat((buff.value * 100).toFixed(0), "% enemy attack speed");
                iconKey = 'slowing_aura';
                break;
            default:
                upgradeName = buff.type;
                upgradeDescription = "Value: ".concat(buff.value);
                iconKey = '';
        }
        return { upgradeName: upgradeName, upgradeDescription: upgradeDescription, iconKey: iconKey };
    };
    UnitTooltip.prototype.calculateBaseStats = function (unit) {
        // This would ideally come from a unit configuration file
        // For now, we'll reverse-calculate from the current stats and buffs
        var baseDamage = unit.damage;
        var baseMaxHealth = unit.maxHealth;
        var baseAttackSpeed = unit.attackSpeed;
        if (unit.buffs) {
            unit.buffs.forEach(function (buff) {
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
    };
    UnitTooltip.prototype.calculateBuffedStats = function (unit, baseStats) {
        return {
            damage: unit.damage,
            maxHealth: unit.maxHealth,
            attackSpeed: unit.attackSpeed
        };
    };
    return UnitTooltip;
}(Phaser.GameObjects.Container));
exports.default = UnitTooltip;
