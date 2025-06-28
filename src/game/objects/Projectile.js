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
exports.Projectile = void 0;
var Phaser = __importStar(require("phaser"));
var Projectile = /** @class */ (function (_super) {
    __extends(Projectile, _super);
    function Projectile(scene, config) {
        var _this = _super.call(this, scene, config.startX, config.startY) || this;
        console.log("\uD83C\uDFAF PROJECTILE CONSTRUCTOR: Creating projectile from (".concat(config.startX, ", ").concat(config.startY, ") to (").concat(config.targetX, ", ").concat(config.targetY, ") with texture: ").concat(config.texture));
        console.log("\uD83C\uDFAF Scene info: active=".concat(scene.scene.isActive(), ", cameras=").concat(scene.cameras ? 'OK' : 'NULL'));
        _this.targetX = config.targetX;
        _this.targetY = config.targetY;
        _this.speed = config.speed || 400; // pixels per second
        _this.onComplete = config.onComplete;
        _this.startTime = scene.time.now;
        // Create the projectile sprite
        console.log("\uD83C\uDFAF Creating sprite with texture: ".concat(config.texture, ", frame: ").concat(config.frame));
        console.log("\uD83C\uDFAF Texture exists: ".concat(scene.textures.exists(config.texture)));
        // If no frame specified, try to find a suitable projectile frame
        var frameToUse = config.frame;
        if (!frameToUse && scene.textures.exists(config.texture)) {
            var frameNames = scene.textures.get(config.texture).getFrameNames();
            // Look for Charge_1_1 frame for wizard
            if (config.texture === 'wizard') {
                frameToUse = frameNames.find(function (f) { return f.includes('Charge_1_1'); }) || frameNames[0];
                console.log("\uD83C\uDFAF Auto-selected wizard frame: ".concat(frameToUse));
            }
            else {
                frameToUse = frameNames[0];
            }
        }
        try {
            _this.projectileSprite = scene.add.sprite(0, 0, config.texture, frameToUse);
            _this.projectileSprite.setScale(config.scale || 0.8);
            // Fix rotation artifacts by setting proper blend mode and alpha handling
            _this.projectileSprite.setBlendMode(Phaser.BlendModes.NORMAL);
            // Disable texture smoothing to prevent white edge artifacts during rotation
            if (_this.projectileSprite.texture && _this.projectileSprite.texture.source) {
                _this.projectileSprite.texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
            // Ensure the sprite doesn't have any tint that might cause color issues
            _this.projectileSprite.clearTint();
            // Set proper origin for rotation
            _this.projectileSprite.setOrigin(0.5, 0.5);
            // Ensure the sprite is visible and positioned properly
            _this.projectileSprite.setVisible(true);
            _this.projectileSprite.setAlpha(1.0);
            _this.projectileSprite.setRoundPixels(true);
            console.log("\uD83C\uDFAF Sprite created: width=".concat(_this.projectileSprite.width, ", height=").concat(_this.projectileSprite.height, ", visible=").concat(_this.projectileSprite.visible, ", frame=").concat(frameToUse));
            // If sprite has no dimensions, it probably failed to load
            if (_this.projectileSprite.width === 0 || _this.projectileSprite.height === 0) {
                console.warn("\uD83C\uDFAF Sprite has zero dimensions, creating fallback");
                _this.projectileSprite.destroy();
                throw new Error('Sprite has zero dimensions');
            }
        }
        catch (error) {
            console.error("\uD83C\uDFAF Failed to create sprite with texture, creating fallback graphics:", error);
            // Create a simple graphics object as fallback
            var graphics = scene.add.graphics();
            graphics.fillStyle(0x00ffff, 1.0);
            graphics.fillCircle(0, 0, 12);
            graphics.lineStyle(2, 0xffffff, 1.0);
            graphics.strokeCircle(0, 0, 12);
            // Cast to sprite-like object for compatibility
            _this.projectileSprite = graphics;
            _this.projectileSprite.setVisible(true);
            _this.projectileSprite.setAlpha(1.0);
            console.log("\uD83C\uDFAF Fallback graphics created: visible=".concat(_this.projectileSprite.visible));
        }
        // Add sprite to container
        _this.add(_this.projectileSprite);
        console.log("\uD83C\uDFAF Sprite added to container, container children: ".concat(_this.list.length));
        // Calculate angle to target
        var angle = Phaser.Math.Angle.Between(config.startX, config.startY, config.targetX, config.targetY);
        // Rotate the sprite directly instead of the container to avoid double rendering
        // For wizard projectiles, the sprite faces right by default, so we don't need to add 90 degrees
        if (config.texture === 'wizard') {
            _this.projectileSprite.setRotation(angle);
        }
        else {
            // For other projectiles, add 90 degrees for proper orientation
            _this.projectileSprite.setRotation(angle + Math.PI / 2);
        }
        // Don't rotate the container itself
        _this.setRotation(0);
        // Set round pixels to prevent sub-pixel positioning artifacts
        _this.setRoundPixels(true);
        // Set depth based on starting Y position
        _this.setDepth(config.startY + 100); // Above units
        // Add to scene
        scene.add.existing(_this);
        // Log final container state
        console.log("\uD83C\uDFAF Container created: x=".concat(_this.x, ", y=").concat(_this.y, ", depth=").concat(_this.depth, ", visible=").concat(_this.visible, ", alpha=").concat(_this.alpha));
        console.log("\uD83C\uDFAF Container children count: ".concat(_this.list.length));
        console.log("\uD83C\uDFAF Scene children count: ".concat(scene.children.length));
        // Make container extra visible for debugging
        _this.setVisible(true);
        _this.setAlpha(1.0);
        return _this;
        // Don't create animations to avoid frame conflicts - use single frame for projectiles
        // this.createAnimation();
    }
    Projectile.prototype.createAnimation = function () {
        var textureKey = this.projectileSprite.texture.key;
        var animKey = "".concat(textureKey, "_projectile");
        // Check if animation already exists
        if (this.scene.anims.exists(animKey)) {
            this.projectileSprite.play(animKey);
            return;
        }
        // Check if texture has frames
        if (!this.scene.textures.exists(textureKey)) {
            return;
        }
        var frameNames = this.scene.textures.get(textureKey).getFrameNames();
        // Find projectile frames - prioritize Charge_1_X frames for wizards, fallback to Magic_arrow
        var projectileFrames = [];
        if (textureKey === 'wizard') {
            // For wizard, use Charge_1_X frames (excluding Charge_1_9 which is a different animation)
            var chargeFrames = frameNames.filter(function (frame) {
                return frame.includes('Charge_1_') &&
                    frame.includes('.png') &&
                    !frame.includes('Charge_1_9') && // Exclude frame 9 which looks different
                    !frame.includes('Charge_1_8') && // Exclude frame 8 which looks different
                    !frame.includes('Charge_1_7') && // Exclude frame 7 which looks different
                    !frame.includes('Charge_1_6');
            } // Exclude frame 6 which looks different
            );
            console.log('Wizard Charge frames found:', chargeFrames.length, chargeFrames);
            projectileFrames = chargeFrames;
        }
        // Fallback to Magic_arrow or other projectile frames
        if (projectileFrames.length === 0) {
            var magicArrowFrames = frameNames.filter(function (frame) {
                return frame.toLowerCase().includes('magic_arrow') ||
                    frame.toLowerCase().includes('projectile') ||
                    frame.toLowerCase().includes('spell');
            });
            projectileFrames = magicArrowFrames;
        }
        // Skip if we already have projectile frames
        if (projectileFrames.length > 0) {
            // Sort frames properly by extracting the frame number
            projectileFrames.sort(function (a, b) {
                // Handle both Charge_1_X and Magic_arrow_X patterns, accounting for space and #number format
                // Examples: "Charge_1_1 #10.png", "Magic_arrow_1 #6.png"
                var chargeMatchA = a.match(/Charge_1_(\d+)\s*/i);
                var chargeMatchB = b.match(/Charge_1_(\d+)\s*/i);
                var magicMatchA = a.match(/Magic_arrow_(\d+)\s*/i);
                var magicMatchB = b.match(/Magic_arrow_(\d+)\s*/i);
                var numA = chargeMatchA ? parseInt(chargeMatchA[1]) : (magicMatchA ? parseInt(magicMatchA[1]) : 0);
                var numB = chargeMatchB ? parseInt(chargeMatchB[1]) : (magicMatchB ? parseInt(magicMatchB[1]) : 0);
                return numA - numB;
            });
            console.log('Sorted projectile frames:', projectileFrames);
            console.log('Creating projectile animation with frames:', projectileFrames);
            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNames(textureKey, {
                    frames: projectileFrames
                }),
                frameRate: 12,
                repeat: -1
            });
            this.projectileSprite.play(animKey);
        }
    };
    Projectile.prototype.update = function (time, delta) {
        // Calculate distance to target
        var distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
        // Check if reached target
        if (distance < 5) {
            this.destroy();
            if (this.onComplete) {
                this.onComplete();
            }
            return;
        }
        // Move towards target
        var step = (this.speed * delta) / 1000;
        var angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
        this.x = Math.round(this.x + Math.cos(angle) * step);
        this.y = Math.round(this.y + Math.sin(angle) * step);
        // Update depth based on current Y position
        this.setDepth(this.y + 100);
    };
    return Projectile;
}(Phaser.GameObjects.Container));
exports.Projectile = Projectile;
