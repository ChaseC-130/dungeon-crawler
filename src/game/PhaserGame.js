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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Phaser = __importStar(require("phaser"));
var MainScene_1 = __importDefault(require("./scenes/MainScene"));
var PreloadScene_1 = __importDefault(require("./scenes/PreloadScene"));
var PhaserGame = /** @class */ (function () {
    function PhaserGame(parent, width, height) {
        var _this = this;
        this.mainScene = null;
        console.log('=== PHASER GAME DEBUG ===');
        console.log('Input dimensions:', { width: width, height: height });
        console.log('Window dimensions:', {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            ratio: window.innerWidth / window.innerHeight
        });
        console.log('Parent element:', parent);
        console.log('Parent computed style:', parent ? window.getComputedStyle(parent) : 'No parent');
        // Use the provided parent element and respect React Native layout
        if (parent) {
            parent.style.cssText = "\n        width: 100% !important;\n        height: 100% !important;\n        background-color: #000 !important;\n      ";
        }
        console.log('Using parent element for game container');
        var config = {
            type: Phaser.AUTO,
            parent: parent,
            width: width,
            height: height,
            scale: {
                mode: Phaser.Scale.RESIZE,
                width: width,
                height: height,
                min: {
                    width: 400, // Minimum width for basic functionality  
                    height: 600 // Minimum height: 8*8px grid + HUD space (64px + ~200px HUD + margins)
                },
                autoCenter: Phaser.Scale.NO_CENTER, // Remove centering to ensure canvas fills container
            },
            input: {
                mouse: {
                    target: parent,
                },
                touch: {
                    target: parent,
                },
                smoothFactor: 0,
                queue: true,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                },
            },
            scene: [PreloadScene_1.default, MainScene_1.default],
        };
        console.log('Creating Phaser.Game with config:', config);
        this.game = new Phaser.Game(config);
        console.log('Phaser.Game created:', this.game);
        console.log('Game canvas:', this.game.canvas);
        console.log('Game renderer:', this.game.renderer);
        console.log('Game scene manager:', this.game.scene);
        // Expose game instance globally for HUD access
        window.gameInstance = this.game;
        // Get reference to main scene after it's created
        this.game.events.once('ready', function () {
            _this.mainScene = _this.game.scene.getScene('MainScene');
            // Expose test functions globally for console access
            if (_this.mainScene) {
                window.testWizardProjectile = function () { return _this.mainScene.testWizardProjectile(); };
                window.addTestWizard = function () { return _this.mainScene.addTestWizard(); };
                window.testResponsive = function () { return _this.mainScene.testResponsiveBehavior(); };
                console.log('🧙 Global functions available: testWizardProjectile(), addTestWizard(), testResponsive()');
            }
        });
    }
    PhaserGame.prototype.updateGameState = function (gameState) {
        if (this.mainScene && this.mainScene.scene.isActive()) {
            this.mainScene.updateGameState(gameState);
        }
    };
    PhaserGame.prototype.resize = function (width, height) {
        if (this.game && this.game.scale) {
            this.game.scale.resize(width, height);
        }
    };
    PhaserGame.prototype.destroy = function () {
        if (this.game) {
            this.game.destroy(true);
        }
    };
    return PhaserGame;
}());
exports.default = PhaserGame;
