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
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var Phaser = __importStar(require("phaser"));
// This component exactly replicates the main game's sprite rendering approach
var UnifiedUnitSprite = react_1.default.memo(function (_a) {
    var unitName = _a.unitName, width = _a.width, height = _a.height;
    var containerRef = (0, react_1.useRef)(null);
    var gameRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (!containerRef.current)
            return;
        var SpriteScene = /** @class */ (function (_super) {
            __extends(SpriteScene, _super);
            function SpriteScene() {
                return _super.call(this, { key: 'SpriteScene' }) || this;
            }
            SpriteScene.prototype.preload = function () {
                var textureKey = unitName.toLowerCase();
                // Check if texture is already loaded in main game
                var mainGame = window.gameInstance;
                if (mainGame && mainGame.textures && mainGame.textures.exists(textureKey)) {
                    console.log("Texture for ".concat(unitName, " already exists in main game"));
                    return;
                }
                // Otherwise load it
                // Special handling for red dragon - files are named without space
                var pathKey = unitName.toLowerCase();
                var fileName = pathKey === 'red dragon' ? 'reddragon' : pathKey;
                var imgUrl = "/assets/units/".concat(pathKey, "/").concat(fileName, ".png");
                var jsonUrl = "/assets/units/".concat(pathKey, "/").concat(fileName, ".json");
                console.log("UnifiedUnitSprite loading: ".concat(unitName, " -> img=").concat(imgUrl, ", json=").concat(jsonUrl));
                this.load.atlas(textureKey, imgUrl, jsonUrl);
                this.load.on('loaderror', function (file) {
                    console.error("Failed to load file: ".concat(file.key), file);
                });
            };
            SpriteScene.prototype.create = function () {
                var textureKey = unitName.toLowerCase();
                // Center camera on origin (0,0) where sprite will be
                this.cameras.main.centerOn(0, 0);
                if (!this.textures.exists(textureKey)) {
                    console.error("UnifiedUnitSprite: Texture ".concat(textureKey, " for unit ").concat(unitName, " does not exist, using placeholder"));
                    // Create placeholder sprite exactly like main game
                    if (!this.textures.exists('__DEFAULT')) {
                        var graphics = this.add.graphics();
                        graphics.fillStyle(0x888888);
                        graphics.fillRect(0, 0, 64, 64);
                        graphics.generateTexture('__DEFAULT', 64, 64);
                        graphics.destroy();
                    }
                    var sprite_1 = this.add.sprite(0, 0, '__DEFAULT');
                    sprite_1.setScale(0.8);
                    // Add text to show which unit failed
                    var text = this.add.text(0, 0, unitName, {
                        fontSize: '16px',
                        color: '#ffffff',
                        align: 'center'
                    });
                    text.setOrigin(0.5, 0.5);
                    return;
                }
                console.log("UnifiedUnitSprite: Successfully loaded texture ".concat(textureKey, " for unit ").concat(unitName));
                // Get frames from atlas
                var texture = this.textures.get(textureKey);
                var frameNames = texture.getFrameNames();
                if (frameNames.length === 0) {
                    var sprite_2 = this.add.sprite(0, 0, textureKey);
                    sprite_2.setScale(0.8);
                    return;
                }
                // Complex frame sorting function from main game
                var sortFrames = function (frames) {
                    return frames.sort(function (frameA, frameB) {
                        var extractFrameInfo = function (frameName) {
                            var match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
                            if (match) {
                                var mainFrame = parseInt(match[2], 10);
                                var subFrame = match[3] ? parseInt(match[3], 10) : 0;
                                return { mainFrame: mainFrame, subFrame: subFrame };
                            }
                            var fallbackMatch = frameName.match(/(\d+)/);
                            if (fallbackMatch) {
                                return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
                            }
                            return { mainFrame: Infinity, subFrame: Infinity };
                        };
                        var infoA = extractFrameInfo(frameA);
                        var infoB = extractFrameInfo(frameB);
                        if (infoA.mainFrame === infoB.mainFrame) {
                            return infoA.subFrame - infoB.subFrame;
                        }
                        return infoA.mainFrame - infoB.mainFrame;
                    });
                };
                // Find and create idle animation exactly like main game
                var idleFrames = frameNames.filter(function (frame) {
                    return frame.toLowerCase().includes('idle');
                });
                var animationKey = "".concat(textureKey, "_idle");
                var framesToUse = idleFrames;
                var frameRate = 8; // Idle animations use 8 fps in constructor
                if (idleFrames.length > 0) {
                    // Sort idle frames using complex sorting
                    framesToUse = sortFrames(idleFrames);
                }
                else {
                    // Fallback: use first 4 frames as idle
                    framesToUse = frameNames.slice(0, Math.min(4, frameNames.length));
                    frameRate = 10; // Other animations use 10 fps
                }
                // Create animation if it doesn't exist
                if (!this.anims.exists(animationKey)) {
                    this.anims.create({
                        key: animationKey,
                        frames: this.anims.generateFrameNames(textureKey, {
                            frames: framesToUse
                        }),
                        frameRate: frameRate,
                        repeat: -1
                    });
                }
                // Find first frame to display (prefer idle frame)
                var firstFrame = idleFrames.length > 0 ?
                    idleFrames.find(function (f) { return f.toLowerCase().includes('idle'); }) || frameNames[0] :
                    frameNames[0];
                // Create sprite at (0,0) exactly like main game
                var sprite = this.add.sprite(0, 0, textureKey, firstFrame);
                sprite.setScale(0.8);
                // Play animation
                sprite.play(animationKey);
            };
            return SpriteScene;
        }(Phaser.Scene));
        var config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: width,
            height: height,
            transparent: true,
            scene: SpriteScene
        };
        gameRef.current = new Phaser.Game(config);
        return function () {
            if (gameRef.current) {
                gameRef.current.destroy(true, true);
                gameRef.current = null;
            }
        };
    }, [unitName, width, height]);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.container, { width: width, height: height }], children: (0, jsx_runtime_1.jsx)("div", { ref: containerRef, style: { width: '100%', height: '100%' } }) }));
});
var styles = react_native_1.StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});
exports.default = UnifiedUnitSprite;
