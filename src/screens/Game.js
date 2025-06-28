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
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var GameContext_1 = require("../contexts/GameContext");
var GameHUD_1 = __importDefault(require("../components/GameHUD"));
var PhaserGame_1 = __importDefault(require("../game/PhaserGame"));
var UnitSelectionModal_1 = __importDefault(require("../components/UnitSelectionModal"));
require("../game/debugHelpers"); // Load debug helpers
var Game = function () {
    var route = (0, native_1.useRoute)();
    var _a = (0, GameContext_1.useGame)(), gameState = _a.gameState, player = _a.player, placeUnit = _a.placeUnit, moveUnit = _a.moveUnit, purchaseUnit = _a.purchaseUnit, purchaseAndPlaceUnit = _a.purchaseAndPlaceUnit, selectStartingUnits = _a.selectStartingUnits;
    var gameRef = (0, react_1.useRef)(null);
    var containerRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(true), showUnitSelection = _b[0], setShowUnitSelection = _b[1];
    var _c = (0, react_1.useState)(false), hasSelectedUnits = _c[0], setHasSelectedUnits = _c[1];
    var _d = (0, react_1.useState)(react_native_1.Dimensions.get('window')), dimensions = _d[0], setDimensions = _d[1];
    (0, react_1.useEffect)(function () {
        var subscription = react_native_1.Dimensions.addEventListener('change', function (_a) {
            var window = _a.window;
            setDimensions(window);
            // Trigger game resize if game exists
            if (gameRef.current && react_native_1.Platform.OS === 'web') {
                gameRef.current.resize(window.width, window.height);
            }
        });
        // Add web-specific resize listener
        var handleWebResize = function () {
            if (react_native_1.Platform.OS === 'web') {
                var newDimensions = {
                    width: Math.max(400, window.innerWidth), // Enforce minimum width
                    height: Math.max(600, window.innerHeight) // Enforce minimum height to prevent grid cutoff
                };
                setDimensions(newDimensions);
                if (gameRef.current) {
                    gameRef.current.resize(newDimensions.width, newDimensions.height);
                }
            }
        };
        if (react_native_1.Platform.OS === 'web') {
            window.addEventListener('resize', handleWebResize);
        }
        return function () {
            subscription === null || subscription === void 0 ? void 0 : subscription.remove();
            if (react_native_1.Platform.OS === 'web') {
                window.removeEventListener('resize', handleWebResize);
            }
        };
    }, []);
    (0, react_1.useEffect)(function () {
        if (react_native_1.Platform.OS === 'web' && containerRef.current) {
            // Initialize Phaser game for web
            var container = containerRef.current;
            gameRef.current = new PhaserGame_1.default(container, dimensions.width, dimensions.height);
            // Add touch and drag support to the container
            if (container) {
                // Prevent default touch behaviors to allow Phaser to handle them
                container.style.touchAction = 'none';
                container.style.userSelect = 'none';
                container.style.webkitUserSelect = 'none';
                container.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                });
                container.addEventListener('drop', function (e) {
                    e.preventDefault();
                    var unitType = e.dataTransfer.getData('unitType');
                    var action = e.dataTransfer.getData('action');
                    if (unitType && action === 'purchase') {
                        // Let the MainScene handle the drop through its existing pointer events
                        console.log('Dropped unit:', unitType);
                    }
                });
                // Prevent context menu on touch devices
                container.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                });
            }
            // Expose functions globally for Phaser to access
            window.purchaseAndPlaceUnit = purchaseAndPlaceUnit;
            window.placeUnit = placeUnit;
            window.moveUnit = moveUnit;
            window.purchaseUnit = purchaseUnit;
            // Listen for game events
            var game_1 = window.gameInstance;
            if (game_1) {
                // Wait for scene to be ready
                game_1.events.once('ready', function () {
                    var scene = game_1.scene.getScene('MainScene');
                    if (scene) {
                        scene.events.on('purchase-and-place', function (unitType, position) {
                            purchaseAndPlaceUnit(unitType, position);
                        });
                        scene.events.on('place-unit', function (unitId, position) {
                            console.log('Game.tsx received place-unit event:', { unitId: unitId, position: position });
                            placeUnit(unitId, position);
                        });
                    }
                });
            }
        }
        return function () {
            // Cleanup Phaser game
            if (gameRef.current) {
                gameRef.current.destroy();
            }
            // Cleanup global functions
            delete window.purchaseAndPlaceUnit;
            delete window.placeUnit;
            delete window.moveUnit;
            delete window.purchaseUnit;
        };
    }, [placeUnit, moveUnit, purchaseUnit, purchaseAndPlaceUnit]);
    (0, react_1.useEffect)(function () {
        // Update Phaser game state when React state changes
        if (gameRef.current && gameState) {
            gameRef.current.updateGameState(gameState);
        }
    }, [gameState]);
    var handleUnitSelection = function (units) {
        selectStartingUnits(units);
        setShowUnitSelection(false);
        setHasSelectedUnits(true);
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { ref: containerRef, style: styles.gameContainer }), (0, jsx_runtime_1.jsx)(GameHUD_1.default, {}), gameState && gameState.currentFloor === 1 && !hasSelectedUnits && ((0, jsx_runtime_1.jsx)(UnitSelectionModal_1.default, { visible: showUnitSelection, onComplete: handleUnitSelection }))] }));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    gameContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
});
exports.default = Game;
