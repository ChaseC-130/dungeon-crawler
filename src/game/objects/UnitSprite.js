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
var UnitSprite = /** @class */ (function (_super) {
    __extends(UnitSprite, _super);
    function UnitSprite(scene, x, y, unit) {
        var _this = _super.call(this, scene, x, y) || this;
        _this.lastStatus = 'idle';
        _this.lastSoundTime = 0;
        _this.unitId = unit.id;
        _this.unit = unit;
        _this.isPlayerUnit = !unit.id.startsWith('enemy-');
        // Create sprite - use the unit name as is since that's how it's loaded
        var textureKey = unit.name.toLowerCase();
        // Check if texture exists
        if (!scene.textures.exists(textureKey)) {
            console.error("Texture not found for unit: ".concat(textureKey));
            // Create a placeholder rectangle if texture is missing
            _this.sprite = scene.add.sprite(0, 0, '__DEFAULT');
            if (!scene.textures.exists('__DEFAULT')) {
                var graphics = scene.add.graphics();
                graphics.fillStyle(0x888888);
                graphics.fillRect(0, 0, 64, 64);
                graphics.generateTexture('__DEFAULT', 64, 64);
                graphics.destroy();
            }
        }
        else {
            // Get the first frame from the texture atlas
            var texture = scene.textures.get(textureKey);
            var frameNames = texture.getFrameNames();
            console.log("Loading sprite for ".concat(textureKey, ", found ").concat(frameNames.length, " frames"));
            if (frameNames.length > 0) {
                // Try to find an idle frame first
                var idleFrame = frameNames.find(function (frame) {
                    // Handle both "Idle_1.png" and "Idle_1" formats
                    var frameName = frame.toLowerCase();
                    return frameName.includes('idle');
                });
                var firstFrame = idleFrame || frameNames[0];
                console.log("Using frame: ".concat(firstFrame, " for ").concat(textureKey));
                _this.sprite = scene.add.sprite(0, 0, textureKey, firstFrame);
                // If we found an idle frame, try to create/play idle animation
                if (idleFrame) {
                    var idleFrames = frameNames.filter(function (f) { return f.toLowerCase().includes('idle'); });
                    if (idleFrames.length > 1 && !scene.anims.exists("".concat(textureKey, "_idle"))) {
                        // Sort idle frames to ensure consistent order across all contexts
                        idleFrames.sort();
                        scene.anims.create({
                            key: "".concat(textureKey, "_idle"),
                            frames: scene.anims.generateFrameNames(textureKey, {
                                frames: idleFrames
                            }),
                            frameRate: 8,
                            repeat: -1
                        });
                        _this.sprite.play("".concat(textureKey, "_idle"));
                    }
                }
            }
            else {
                console.warn("No frames found for ".concat(textureKey, ", using base texture"));
                _this.sprite = scene.add.sprite(0, 0, textureKey);
            }
        }
        _this.sprite.setScale(0.8);
        // Remove tinting - units should use their original colors
        // Create health bar background
        _this.healthBarBg = scene.add.rectangle(0, -40, 50, 6, 0x000000);
        _this.healthBarBg.setStrokeStyle(1, 0x333333);
        // Create health bar
        _this.healthBar = scene.add.graphics();
        _this.updateHealthBar();
        // Create name text
        _this.nameText = scene.add.text(0, 25, unit.name, {
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        _this.nameText.setOrigin(0.5);
        // Create upgrade icons container
        _this.upgradeIcons = scene.add.container(0, -50);
        _this.updateUpgradeIcons();
        // Add all components to container
        _this.add([_this.sprite, _this.healthBarBg, _this.healthBar, _this.nameText, _this.upgradeIcons]);
        // Set depth based on y position
        _this.setDepth(y);
        // Make the container interactive for proper drag and drop
        // Adjust hit area to cover all visual elements including health bar and upgrade icons
        // The hit area needs to extend from y:-55 (above upgrade icons) to y:30 (below name text)
        _this.setInteractive(new Phaser.Geom.Rectangle(-32, -55, 64, 85), Phaser.Geom.Rectangle.Contains);
        // Store reference to this sprite on the interactive object for easier hit detection
        _this.setData('isUnitSprite', true);
        _this.setData('unitId', unit.id);
        // Play idle animation
        _this.playAnimation('idle');
        scene.add.existing(_this);
        _this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (animation) {
            // Check if sprite and unit still exist and animation is death animation
            if (_this.active && !_this.getData('destroying') && _this.unit && animation.key === "".concat(_this.unit.name.toLowerCase(), "_death")) {
                // Hide health bar and name for dead units
                _this.healthBarBg.setVisible(false);
                _this.healthBar.setVisible(false);
                _this.nameText.setVisible(false);
                // Emit event immediately when death animation completes
                if (_this.active && !_this.getData('destroying')) {
                    _this.emit('death_animation_complete', _this.unitId);
                }
            }
        }, _this);
        return _this;
    }
    UnitSprite.prototype.isRangedUnit = function () {
        var rangedUnitTypes = ['wizard', 'priest', 'druidess', 'storms'];
        return rangedUnitTypes.includes(this.unit.name.toLowerCase());
    };
    UnitSprite.prototype.updateUnit = function (unit) {
        // Safety check - don't update if sprite is being destroyed
        if (!this.active || this.getData('destroying')) {
            return;
        }
        // Debug for red dragons
        if (unit.name.toLowerCase().includes('dragon')) {
            console.log("\uD83D\uDC09 CLIENT: Dragon ".concat(unit.id, " update - Status: ").concat(unit.status, ", Health: ").concat(unit.health, ", SpecialState:"), unit.specialAttackState, 'Flying:', unit.isFlying);
        }
        this.unit = unit;
        // Update health bar
        this.updateHealthBar();
        // Update upgrade icons
        this.updateUpgradeIcons();
        // Update position if needed
        if (unit.status === 'moving' || unit.status === 'attacking') {
            // Position is updated by the server during combat
        }
        // Check if unit should be dead (health <= 0) but status isn't updated yet
        var shouldBeDead = unit.health <= 0 && unit.status !== 'dead';
        var effectiveStatus = shouldBeDead ? 'dead' : unit.status;
        // Update animation based on status
        var statusChanged = effectiveStatus !== this.lastStatus;
        switch (effectiveStatus) {
            case 'idle':
                this.playAnimation('idle');
                break;
            case 'moving':
                // Special handling for red dragon flying movement
                if (this.unit.name.toLowerCase().includes('dragon') && this.unit.isFlying) {
                    this.playAnimation('flight');
                }
                else {
                    this.playAnimation('walk');
                }
                break;
            case 'attacking':
                console.log("\uD83C\uDFAC UnitSprite: ".concat(this.unit.name, " (").concat(this.unit.id, ") entering attacking state. Status changed: ").concat(statusChanged));
                this.playAnimation('attack');
                if (statusChanged) {
                    this.playAttackSound();
                    // Emit event for ranged units starting attack (for projectile creation)
                    if (this.isRangedUnit()) {
                        console.log("\uD83C\uDFAF EMITTING EVENT: Ranged unit ".concat(this.unit.name, " starting attack"));
                        this.scene.events.emit('rangedUnitAttack', this.unit);
                        console.log("\uD83C\uDFAF Event emitted for ranged unit attack");
                    }
                    else {
                        console.log("\uD83D\uDDE1\uFE0F Melee unit ".concat(this.unit.name, " attacking - no projectile needed"));
                    }
                }
                break;
            case 'rise':
                // Special status for red dragon rise animation
                console.log("\uD83D\uDC09 UnitSprite: ".concat(this.unit.name, " (").concat(this.unit.id, ") entering rise state"));
                this.playAnimation('rise');
                // Also trigger the rise visual effect immediately
                if (this.unit.name.toLowerCase().includes('dragon')) {
                    console.log("\uD83C\uDFAC Triggering rise visual effect for dragon ".concat(this.unit.id));
                    // Add slight elevation effect
                    this.scene.tweens.add({
                        targets: this,
                        y: this.y - 3,
                        duration: 2000,
                        ease: 'Power2.easeOut'
                    });
                }
                break;
            case 'dead':
                this.playAnimation('death');
                if (statusChanged) {
                    this.playDeathSound();
                }
                break;
        }
        this.lastStatus = effectiveStatus;
        // Update depth based on y position only if still active
        if (this.active) {
            this.setDepth(this.y);
        }
    };
    UnitSprite.prototype.updateHealthBar = function () {
        // Safety check - don't update if sprite is being destroyed or unit is null
        if (!this.active || this.getData('destroying') || !this.unit || !this.healthBar) {
            return;
        }
        this.healthBar.clear();
        var healthPercent = Math.max(0, this.unit.health / this.unit.maxHealth);
        var barWidth = Math.max(0, 50 * healthPercent);
        // Choose color based on health percentage
        var color = 0x4CAF50; // Green
        if (healthPercent <= 0) {
            color = 0x000000; // Black for dead/0 health
        }
        else if (healthPercent < 0.3) {
            color = 0xF44336; // Red
        }
        else if (healthPercent < 0.6) {
            color = 0xFF9800; // Orange
        }
        this.healthBar.fillStyle(color);
        this.healthBar.fillRect(-25, -43, barWidth, 6);
        // Debug logging for health updates
        if (this.unit.health <= 0 && this.unit.status !== 'dead') {
            console.log("Unit ".concat(this.unit.name, " (").concat(this.unitId, ") has 0 health but status is: ").concat(this.unit.status));
        }
    };
    UnitSprite.prototype.playAnimation = function (animKey) {
        var _a, _b;
        // Safety check - don't play animations if sprite is being destroyed or unit is null
        if (!this.active || this.getData('destroying') || !this.unit || !this.sprite) {
            return;
        }
        if (animKey === 'attack') {
            console.log("\uD83C\uDFAC UnitSprite.playAnimation(".concat(animKey, ") called for ").concat(this.unit.name, " (").concat(this.unit.id, ")"));
        }
        // Check if animation exists for this unit
        var textureKey = this.unit.name.toLowerCase();
        if (!this.scene.textures.exists(textureKey)) {
            return;
        }
        var frameNames = this.scene.textures.get(textureKey).getFrameNames();
        // Special handling for red dragon animations
        if (textureKey === 'red dragon') {
            console.log("\uD83D\uDC09 Red Dragon animation request: ".concat(animKey, ", Special Mode: ").concat((_a = this.unit.specialAttackState) === null || _a === void 0 ? void 0 : _a.isInSpecialMode, ", Flying: ").concat(this.unit.isFlying));
            if (animKey === 'attack') {
                // Check if the dragon is in special mode
                var isInSpecialMode = (_b = this.unit.specialAttackState) === null || _b === void 0 ? void 0 : _b.isInSpecialMode;
                if (isInSpecialMode) {
                    // Use Special animation for special attacks
                    animKey = 'Special';
                    console.log("\uD83D\uDC09 Red Dragon using Special animation for special attack");
                }
                else {
                    console.log("\uD83D\uDC09 Red Dragon using normal attack animation");
                }
            }
            else if (animKey === 'rise') {
                // Use Rise animation for power-up sequence
                animKey = 'Rise';
                console.log("\uD83D\uDC09 Red Dragon using Rise animation for power-up");
            }
            else if (animKey === 'flight') {
                // Use Flight animation for flying movement
                animKey = 'Flight';
                console.log("\uD83D\uDC09 Red Dragon using Flight animation for flying movement");
            }
        }
        // Create animation if it doesn't exist
        var animationKey = "".concat(this.unit.name.toLowerCase(), "_").concat(animKey);
        if (!this.scene.anims.exists(animationKey)) {
            // Find frames that match the animation pattern
            var animFrames = frameNames.filter(function (frame) {
                var frameLower = frame.toLowerCase();
                if (animKey === 'idle') {
                    return frameLower.includes('idle');
                }
                else if (animKey === 'walk') {
                    return frameLower.includes('walk') || frameLower.includes('run');
                }
                else if (animKey === 'attack') {
                    return frameLower.includes('attack');
                }
                else if (animKey === 'dead' || animKey === 'death') {
                    return frameLower.includes('dead_');
                }
                else if (animKey === 'special' || animKey === 'Special') {
                    return frameLower.includes('special');
                }
                else if (animKey === 'flying' || animKey === 'flight' || animKey === 'Flight') {
                    return frameLower.includes('flight');
                }
                else if (animKey === 'rise' || animKey === 'Rise') {
                    return frameLower.includes('rise');
                }
                else if (animKey === 'landing') {
                    return frameLower.includes('landing');
                }
                return false;
            });
            if (animFrames.length > 0) {
                // Sort frames to ensure proper order using a custom sort
                animFrames.sort(function (frameA, frameB) {
                    var extractFrameInfo = function (frameName) {
                        // Matches: (Action)_ (MainFrameNumber) _ (SubFrameNumber) (AnythingElse) .png
                        // Or:      (Action)_ (MainFrameNumber) (AnythingElse) .png
                        var match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
                        if (match) {
                            var mainFrame = parseInt(match[2], 10);
                            var subFrame = match[3] ? parseInt(match[3], 10) : 0; // Default subFrame to 0 if not present
                            return { mainFrame: mainFrame, subFrame: subFrame };
                        }
                        // Fallback: try to find any number if the pattern is different
                        var fallbackMatch = frameName.match(/(\d+)/);
                        if (fallbackMatch) {
                            return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
                        }
                        return { mainFrame: Infinity, subFrame: Infinity }; // Should not happen if frames are named with numbers
                    };
                    var infoA = extractFrameInfo(frameA);
                    var infoB = extractFrameInfo(frameB);
                    if (infoA.mainFrame === infoB.mainFrame) {
                        return infoA.subFrame - infoB.subFrame;
                    }
                    return infoA.mainFrame - infoB.mainFrame;
                });
                // Slow red dragon animations by 200% (3x slower)
                var frameRate = (animKey === 'dead' || animKey === 'death') ? 6 : 10;
                if (textureKey === 'red dragon') {
                    frameRate = Math.round(frameRate / 3);
                }
                this.scene.anims.create({
                    key: animationKey,
                    frames: this.scene.anims.generateFrameNames(textureKey, {
                        frames: animFrames
                    }),
                    frameRate: frameRate,
                    repeat: (animKey === 'dead' || animKey === 'death') ? 0 : -1
                });
            }
            else if (animKey === 'idle' && frameNames.length > 0) {
                // If no idle frames found, use all frames as idle animation
                this.scene.anims.create({
                    key: animationKey,
                    frames: this.scene.anims.generateFrameNames(textureKey, {
                        frames: frameNames.slice(0, Math.min(4, frameNames.length))
                    }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        }
        // Play the animation
        if (this.scene.anims.exists(animationKey)) {
            this.sprite.play(animationKey);
        }
    };
    UnitSprite.prototype.startCombat = function () {
        // Combat is handled by server updates
    };
    UnitSprite.prototype.stopCombat = function () {
        // Return to idle
        if (this.unit.status !== 'dead') {
            this.playAnimation('idle');
        }
    };
    UnitSprite.prototype.update = function (time, delta) {
        // Safety check - don't update if sprite is being destroyed
        if (!this.active || this.getData('destroying')) {
            return;
        }
        // Update depth based on current Y position for proper layering
        this.setDepth(this.y);
    };
    UnitSprite.prototype.playAttackSound = function () {
        var currentTime = this.scene.time.now;
        if (currentTime - this.lastSoundTime < 500)
            return; // Debounce 500ms
        // Special handling for red dragon sound
        var soundKey = this.unit.name.toLowerCase() === 'red dragon'
            ? 'redDragonSound'
            : "".concat(this.unit.name.toLowerCase(), "Sound");
        if (this.scene.sound.get(soundKey)) {
            this.scene.sound.play(soundKey, { volume: 0.3 });
            this.lastSoundTime = currentTime;
        }
    };
    UnitSprite.prototype.playDeathSound = function () {
        // Play explosion sound for death
        if (this.scene.sound.get('explodeSound')) {
            this.scene.sound.play('explodeSound', { volume: 0.2 });
        }
    };
    UnitSprite.prototype.updateUpgradeIcons = function () {
        var _this = this;
        // Clear existing icons
        this.upgradeIcons.removeAll(true);
        if (!this.unit.buffs || this.unit.buffs.length === 0) {
            return;
        }
        // Map buff types to icon names
        var iconMap = {
            'lifesteal': 'vampiric_strike',
            'movementSpeed': 'swift_boots',
            'health': 'vitality_boost',
            'damage': 'power_surge',
            'attackSpeed': 'rapid_strikes',
            'priority': 'evasive_maneuvers', // We'll handle taunt case below
            'deathHeal': 'final_gift',
            'deathExplosion': 'explosive_end',
            'poison': 'poison_blade',
            'slowAura': 'slowing_aura'
        };
        var iconIndex = 0;
        var iconSize = 16;
        var iconSpacing = 18;
        this.unit.buffs.forEach(function (buff) {
            var iconKey = iconMap[buff.type];
            // Special case for priority (negative = taunt)
            if (buff.type === 'priority' && buff.value < 0) {
                iconKey = 'taunt';
            }
            if (iconKey) {
                try {
                    // Create upgrade icon
                    var icon = _this.scene.add.image((iconIndex * iconSpacing) - ((_this.unit.buffs.length - 1) * iconSpacing / 2), 0, iconKey);
                    icon.setDisplaySize(iconSize, iconSize);
                    icon.setAlpha(0.9);
                    _this.upgradeIcons.add(icon);
                    iconIndex++;
                }
                catch (error) {
                    console.warn("Failed to create upgrade icon for ".concat(iconKey, ":"), error);
                }
            }
        });
    };
    UnitSprite.prototype.destroy = function () {
        // Mark as being destroyed to prevent further updates
        this.setData('destroying', true);
        // Clear any pending timers or callbacks
        if (this.sprite) {
            this.sprite.removeAllListeners();
        }
        // Remove all event listeners from this container
        this.removeAllListeners();
        // Clear unit reference
        this.unit = null;
        _super.prototype.destroy.call(this);
    };
    return UnitSprite;
}(Phaser.GameObjects.Container));
exports.default = UnitSprite;
