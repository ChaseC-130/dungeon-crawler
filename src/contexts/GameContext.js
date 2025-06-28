"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GameProvider = exports.useGame = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var socket_io_client_1 = __importDefault(require("socket.io-client"));
var GameContext = (0, react_1.createContext)(null);
var useGame = function () {
    var context = (0, react_1.useContext)(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
exports.useGame = useGame;
var GameProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), socket = _b[0], setSocket = _b[1];
    var _c = (0, react_1.useState)(null), gameState = _c[0], setGameState = _c[1];
    var _d = (0, react_1.useState)(null), player = _d[0], setPlayer = _d[1];
    var _e = (0, react_1.useState)(false), isConnected = _e[0], setIsConnected = _e[1];
    // Update global gameContext when player changes
    (0, react_1.useEffect)(function () {
        if (window.gameContext) {
            window.gameContext.player = player;
        }
    }, [player]);
    (0, react_1.useEffect)(function () {
        // Initialize socket connection
        var socketInstance = (0, socket_io_client_1.default)(process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001');
        socketInstance.on('connect', function () {
            console.log('Connected to server');
            setIsConnected(true);
        });
        socketInstance.on('disconnect', function () {
            console.log('Disconnected from server');
            setIsConnected(false);
        });
        socketInstance.on('game-state', function (state) {
            setGameState(state);
            // Update current player data
            if (player && state.players) {
                var updatedPlayer = state.players.find(function (p) { return p.id === player.id; });
                if (updatedPlayer) {
                    setPlayer(updatedPlayer);
                }
            }
            // Update game instance with current player ID
            if (window.gameInstance) {
                var scene = window.gameInstance.scene.getScene('MainScene');
                if (scene && scene.currentPlayerId === null && player) {
                    scene.currentPlayerId = player.id;
                }
            }
        });
        socketInstance.on('unit-purchased', function (unit) {
            // When a unit is purchased, check if we have a pending placement
            if (window.pendingPlacement) {
                var position = window.pendingPlacement;
                delete window.pendingPlacement;
                // Immediately place the unit
                socketInstance.emit('place-unit', unit.id, position);
            }
            else {
                // Otherwise enter placement mode for manual placement
                if (window.gameInstance) {
                    var scene = window.gameInstance.scene.getScene('MainScene');
                    if (scene && scene.enterPlacementModeForUnit) {
                        scene.enterPlacementModeForUnit(unit);
                    }
                }
            }
        });
        socketInstance.on('error', function (message) {
            console.error('Game error:', message);
            // Handle error (show toast, etc.)
        });
        socketInstance.on('combat-update', function (playerUnits, enemyUnits) {
            // Update unit positions and states during combat
            if (window.gameInstance) {
                var scene = window.gameInstance.scene.getScene('MainScene');
                if (scene && scene.updateCombatUnits) {
                    scene.updateCombatUnits(playerUnits, enemyUnits);
                }
            }
        });
        socketInstance.on('timer-update', function (timeLeft) {
            // Update the timer in game state - this will trigger a re-render in GameHUD
            setGameState(function (prevState) {
                return prevState ? __assign(__assign({}, prevState), { preparationTimeLeft: timeLeft }) : null;
            });
        });
        socketInstance.on('player-hover', function (playerId, playerName, position, playerColor) {
            console.log('Received player-hover event:', { playerId: playerId, playerName: playerName, position: position, playerColor: playerColor });
            // Update other players' hover positions
            if (window.gameInstance) {
                var scene = window.gameInstance.scene.getScene('MainScene');
                if (scene && scene.updatePlayerHover && player && playerId !== player.id) {
                    console.log('Updating player hover in scene');
                    scene.updatePlayerHover(playerId, playerName, position, playerColor);
                }
                else {
                    console.log('Cannot update player hover:', {
                        hasScene: !!scene,
                        hasUpdateMethod: !!(scene === null || scene === void 0 ? void 0 : scene.updatePlayerHover),
                        hasPlayer: !!player,
                        isDifferentPlayer: player ? playerId !== player.id : false
                    });
                }
            }
            else {
                console.log('No game instance available for player hover');
            }
        });
        socketInstance.on('dragon-rise', function (data) {
            console.log("\uD83C\uDF1F CLIENT RECEIVED dragon-rise event for dragon ".concat(data.dragonId, "!"));
            if (window.gameInstance) {
                var scene = window.gameInstance.scene.getScene('MainScene');
                if (scene && scene.handleDragonRise) {
                    console.log("\uD83C\uDFAC Calling handleDragonRise for dragon ".concat(data.dragonId));
                    scene.handleDragonRise(data.dragonId);
                }
                else {
                    console.log("\u274C Scene or handleDragonRise method not found");
                }
            }
            else {
                console.log("\u274C Game instance not found");
            }
        });
        socketInstance.on('dragon-special-attack', function (data) {
            console.log("\uD83D\uDD25 Dragon ".concat(data.dragonId, " is performing special attack!"));
            if (window.gameInstance) {
                var scene = window.gameInstance.scene.getScene('MainScene');
                if (scene && scene.handleDragonSpecialAttack) {
                    scene.handleDragonSpecialAttack(data.dragonId, data.targetPosition, data.affectedUnits);
                }
            }
        });
        setSocket(socketInstance);
        // Store context reference for game instance
        window.gameContext = { player: player, socket: socketInstance };
        return function () {
            socketInstance.disconnect();
            delete window.gameContext;
        };
    }, []);
    var joinMatch = function (playerName) {
        if (socket && isConnected) {
            var playerId = "player-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
            var newPlayer = {
                id: playerId,
                name: playerName,
                gold: 50,
                units: [],
                isReady: false,
            };
            setPlayer(newPlayer);
            socket.emit('join-match', playerId, playerName);
        }
    };
    var placeUnit = function (unitId, position) {
        if (socket && isConnected) {
            socket.emit('place-unit', unitId, position);
        }
    };
    var moveUnit = function (unitId, position) {
        console.log("GameContext.moveUnit called with unitId: ".concat(unitId, ", position:"), position);
        console.log("Socket connected: ".concat(isConnected, ", socket exists: ").concat(!!socket));
        if (socket && isConnected) {
            socket.emit('moveUnit', unitId, position);
            console.log("Emitted moveUnit event to server");
        }
        else {
            console.error("Cannot emit moveUnit - socket: ".concat(!!socket, ", connected: ").concat(isConnected));
        }
    };
    var purchaseUnit = function (unitType) {
        if (socket && isConnected) {
            socket.emit('purchase-unit', unitType);
        }
    };
    var purchaseAndPlaceUnit = function (unitType, position) {
        if (socket && isConnected) {
            socket.emit('purchaseAndPlaceUnit', { unitType: unitType, position: position });
        }
    };
    var sellUnit = function (unitId) {
        if (socket && isConnected) {
            socket.emit('sell-unit', unitId);
        }
    };
    var rerollShop = function () {
        if (socket && isConnected && player && player.gold >= 10) {
            socket.emit('reroll-shop');
        }
    };
    var selectUpgrade = function (upgradeId, targetUnitType) {
        console.log('GameContext: selectUpgrade called with:', { upgradeId: upgradeId, targetUnitType: targetUnitType, isConnected: isConnected, hasSocket: !!socket });
        if (socket && isConnected) {
            console.log('GameContext: Emitting select-upgrade event to server');
            socket.emit('select-upgrade', upgradeId, targetUnitType);
            console.log('GameContext: select-upgrade event emitted successfully');
        }
        else {
            console.error('GameContext: Cannot emit select-upgrade - socket or connection issue', { hasSocket: !!socket, isConnected: isConnected });
        }
    };
    var setReady = function () {
        if (socket && isConnected) {
            socket.emit('player-ready');
        }
    };
    var selectStartingUnits = function (units) {
        if (socket && isConnected) {
            socket.emit('select-starting-units', units);
        }
    };
    var sendCellHover = function (position) {
        if (socket && isConnected && player) {
            socket.emit('cell-hover', position);
        }
    };
    return ((0, jsx_runtime_1.jsx)(GameContext.Provider, { value: {
            socket: socket,
            gameState: gameState,
            player: player,
            isConnected: isConnected,
            joinMatch: joinMatch,
            placeUnit: placeUnit,
            moveUnit: moveUnit,
            purchaseUnit: purchaseUnit,
            purchaseAndPlaceUnit: purchaseAndPlaceUnit,
            sellUnit: sellUnit,
            rerollShop: rerollShop,
            selectUpgrade: selectUpgrade,
            setReady: setReady,
            selectStartingUnits: selectStartingUnits,
            sendCellHover: sendCellHover,
        }, children: children }));
};
exports.GameProvider = GameProvider;
