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
var PreloadScene = /** @class */ (function (_super) {
    __extends(PreloadScene, _super);
    function PreloadScene() {
        return _super.call(this, { key: 'PreloadScene' }) || this;
    }
    PreloadScene.prototype.preload = function () {
        var _this = this;
        // Create loading bar
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                color: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        this.load.on('progress', function (value) {
            percentText.setText(Math.floor(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
        });
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        // Load backgrounds
        this.load.image('battle1', '/assets/backgrounds/battle1.png');
        this.load.image('battle2', '/assets/backgrounds/battle2.png');
        this.load.image('battle3', '/assets/backgrounds/battle3.png');
        this.load.image('battle4', '/assets/backgrounds/battle4.png');
        // Load tiles
        for (var i = 1; i <= 96; i++) {
            var num = i.toString().padStart(2, '0');
            this.load.image("tile_".concat(num), "/assets/tileset/tiles/Tile_".concat(num, ".png"));
        }
        // Load unit sprites
        var units = [
            'knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard',
            'gladiator', 'assassin', 'blacksmith', 'druidess', 'earth',
            'fire', 'furry', 'glutton', 'merchant', 'recruiter',
            'red dragon', 'researcher', 'storms', 'vampire', 'werewolf', 'worker'
        ];
        units.forEach(function (unit) {
            // Special handling for red dragon - files are named without space
            var unitPath = unit === 'red dragon' ? 'red dragon' : unit;
            var fileName = unit === 'red dragon' ? 'reddragon' : unitPath;
            // Custom loader for TexturePacker format
            _this.load.json("".concat(unit, "_json"), "/assets/units/".concat(unitPath, "/").concat(fileName, ".json"));
            _this.load.image("".concat(unit, "_image"), "/assets/units/".concat(unitPath, "/").concat(fileName, ".png"));
        });
        // Load audio
        this.load.audio('purchase', '/assets/sounds/purchaseSound.mp3');
        this.load.audio('theme1', '/assets/music/1theme.mp3');
        this.load.audio('theme2', '/assets/music/2theme.mp3');
        this.load.audio('theme3', '/assets/music/3theme.mp3');
        this.load.audio('theme4', '/assets/music/4theme.mp3');
        this.load.audio('battletheme1', '/assets/music/1battletheme.mp3');
        this.load.audio('battletheme2', '/assets/music/2battletheme.mp3');
        this.load.audio('battletheme3', '/assets/music/3battletheme.mp3');
        this.load.audio('battletheme4', '/assets/music/4battletheme.mp3');
        // Load unit sounds
        this.load.audio('knightSound', '/assets/units/knight/knightSound.mp3');
        this.load.audio('wizardSound', '/assets/units/wizard/wizardSound.mp3');
        this.load.audio('goblinSound', '/assets/units/goblin/goblinSound.mp3');
        this.load.audio('gladiatorSound', '/assets/units/gladiator/gladiatorSound.mp3');
        this.load.audio('vampireSound', '/assets/units/vampire/vampireSound.mp3');
        this.load.audio('werewolfSound', '/assets/units/werewolf/werewolfSound.mp3');
        this.load.audio('gluttonSound', '/assets/units/glutton/gluttonSound.mp3');
        this.load.audio('furrySound', '/assets/units/furry/furrySound.mp3');
        this.load.audio('redDragonSound', '/assets/units/red dragon/red dragonSound.mp3');
        this.load.audio('explodeSound', '/assets/units/avatars/explode.mp3');
        // Load upgrade icons
        var upgradeIcons = [
            'evasive_maneuvers', 'explosive_end', 'final_gift', 'poison_blade',
            'power_surge', 'rapid_strikes', 'slowing_aura', 'swift_boots',
            'taunt', 'vampiric_strike', 'vitality_boost'
        ];
        upgradeIcons.forEach(function (icon) {
            _this.load.image(icon, "/assets/upgradeicons/".concat(icon, ".png"));
        });
    };
    PreloadScene.prototype.create = function () {
        var _this = this;
        // Process TexturePacker atlases
        var units = [
            'knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard',
            'gladiator', 'assassin', 'blacksmith', 'druidess', 'earth',
            'fire', 'furry', 'glutton', 'merchant', 'recruiter',
            'red dragon', 'researcher', 'storms', 'vampire', 'werewolf', 'worker'
        ];
        units.forEach(function (unit) {
            var jsonData = _this.cache.json.get("".concat(unit, "_json"));
            var imageTexture = _this.textures.get("".concat(unit, "_image"));
            if (jsonData && imageTexture) {
                // Convert TexturePacker format to Phaser atlas
                if (jsonData.textures && jsonData.textures[0] && jsonData.textures[0].frames) {
                    var frames_1 = {};
                    jsonData.textures[0].frames.forEach(function (frame) {
                        // Keep the full filename including .png extension
                        var frameName = frame.filename;
                        frames_1[frameName] = {
                            frame: {
                                x: frame.frame.x,
                                y: frame.frame.y,
                                w: frame.frame.w,
                                h: frame.frame.h
                            },
                            sourceSize: {
                                w: frame.sourceSize.w,
                                h: frame.sourceSize.h
                            },
                            spriteSourceSize: frame.spriteSourceSize
                        };
                    });
                    // Remove the temporary image texture
                    _this.textures.remove("".concat(unit, "_image"));
                    // Add as atlas with converted frames
                    _this.textures.addAtlas(unit, imageTexture.source[0].source, frames_1);
                    console.log("Created atlas for ".concat(unit, " with ").concat(Object.keys(frames_1).length, " frames"));
                }
            }
            else {
                console.error("Failed to load atlas data for ".concat(unit));
            }
        });
        this.scene.start('MainScene');
    };
    return PreloadScene;
}(Phaser.Scene));
exports.default = PreloadScene;
