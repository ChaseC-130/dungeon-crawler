"use strict";
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
// Calculate grid cell size to match main game
var calculateGridCellSize = function () {
    var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
    var gridWidth = 20;
    var gridHeight = 8;
    return Math.min((width * 0.9) / gridWidth, (height * 0.7) / gridHeight);
};
var UnitSprite = react_1.default.memo(function (_a) {
    var unitName = _a.unitName, width = _a.width, height = _a.height, _b = _a.useGridCellSize, useGridCellSize = _b === void 0 ? false : _b;
    var containerRef = (0, react_1.useRef)(null);
    var gameRef = (0, react_1.useRef)(null);
    // Use grid cell size if requested, otherwise use provided dimensions
    var finalWidth = useGridCellSize ? calculateGridCellSize() : width;
    var finalHeight = useGridCellSize ? calculateGridCellSize() : height;
    (0, react_1.useEffect)(function () {
        if (!containerRef.current)
            return;
        // Create a mini Phaser game just for this sprite
        var config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: finalWidth,
            height: finalHeight,
            transparent: true,
            scene: {
                preload: function () {
                    // Check if texture is already loaded in main game
                    var mainGame = window.gameInstance;
                    if (mainGame && mainGame.textures && mainGame.textures.exists(unitName.toLowerCase())) {
                        // Texture already loaded, we can use it
                        return;
                    }
                    // Otherwise load it
                    this.load.atlas(unitName.toLowerCase(), "/assets/units/".concat(unitName.toLowerCase(), "/").concat(unitName.toLowerCase(), ".png"), "/assets/units/".concat(unitName.toLowerCase(), "/").concat(unitName.toLowerCase(), ".json"));
                },
                create: function () {
                    var textureKey = unitName.toLowerCase();
                    // Center camera on origin
                    this.cameras.main.centerOn(0, 0);
                    // Check if texture exists
                    if (!this.textures.exists(textureKey)) {
                        console.error("Texture not found for unit: ".concat(textureKey));
                        return;
                    }
                    // Get frames from atlas
                    var frames = this.textures.get(textureKey).getFrameNames();
                    // Find idle frames using exact same logic as main game
                    var idleFrames = frames.filter(function (frame) {
                        var frameLower = frame.toLowerCase();
                        return frameLower.includes('idle');
                    });
                    console.log("Found ".concat(idleFrames.length, " idle frames for ").concat(unitName, ":"), idleFrames);
                    // Use exact same animation creation logic as main game
                    var animationKey = "".concat(unitName.toLowerCase(), "_idle");
                    if (idleFrames.length > 0) {
                        // Sort idle frames to ensure consistent order across all contexts (simple sort like main game)
                        idleFrames.sort();
                        console.log("Sorted idle frames for ".concat(unitName, ":"), idleFrames);
                        // Create animation with exact same settings as main game
                        if (!this.anims.exists(animationKey)) {
                            console.log("Creating animation ".concat(animationKey));
                            this.anims.create({
                                key: animationKey,
                                frames: this.anims.generateFrameNames(textureKey, {
                                    frames: idleFrames
                                }),
                                frameRate: 8, // Exact same as main game idle animation
                                repeat: -1
                            });
                        }
                        // Try to find first idle frame like main game does
                        var idleFrame = frames.find(function (frame) {
                            var frameName = frame.toLowerCase();
                            return frameName.includes('idle');
                        });
                        var firstFrame = idleFrame || frames[0];
                        // Create sprite at (0,0) exactly like main game
                        var sprite = this.add.sprite(0, 0, textureKey, firstFrame);
                        sprite.setScale(0.8); // Scale before playing animation
                        sprite.setDepth(1); // Ensure sprite is on top
                        // Play animation after all setup
                        sprite.play(animationKey);
                        console.log("Created sprite for ".concat(unitName, " at (0,0) with scale 0.8"));
                    }
                    else if (frames.length > 0) {
                        // No idle frames found, use all frames as idle animation (same as main game fallback)
                        if (!this.anims.exists(animationKey)) {
                            this.anims.create({
                                key: animationKey,
                                frames: this.anims.generateFrameNames(textureKey, {
                                    frames: frames.slice(0, Math.min(4, frames.length))
                                }),
                                frameRate: 8,
                                repeat: -1
                            });
                        }
                        var sprite = this.add.sprite(0, 0, textureKey, frames[0]);
                        sprite.setScale(0.8);
                        sprite.setDepth(1);
                        sprite.play(animationKey);
                    }
                }
            }
        };
        gameRef.current = new Phaser.Game(config);
        return function () {
            if (gameRef.current) {
                gameRef.current.destroy(true, true); // Clear cache as well
                gameRef.current = null;
            }
        };
    }, [unitName, finalWidth, finalHeight]);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.container, { width: finalWidth, height: finalHeight }], children: (0, jsx_runtime_1.jsx)("div", { ref: containerRef, style: {
                width: '100%',
                height: '100%'
            } }) }));
});
var styles = react_native_1.StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});
exports.default = UnitSprite;
