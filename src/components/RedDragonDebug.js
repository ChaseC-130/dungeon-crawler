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
var GameContext_1 = require("../contexts/GameContext");
var RedDragonDebug = function () {
    var _a = (0, react_1.useContext)(GameContext_1.GameContext), socket = _a.socket, gameState = _a.gameState;
    var triggerDragonFlying = function (threshold) {
        // Find a red dragon in the game
        var redDragon = gameState === null || gameState === void 0 ? void 0 : gameState.players.flatMap(function (p) { return p.units; }).concat(gameState.enemyUnits || []).find(function (u) { return u.name.toLowerCase() === 'red dragon'; });
        if (redDragon && socket) {
            console.log("\uD83D\uDC09 Triggering dragon flying at ".concat(threshold, " for ").concat(redDragon.id));
            // Emit a debug event to trigger flying
            socket.emit('debug-dragon-fly', {
                dragonId: redDragon.id,
                threshold: threshold
            });
        }
        else {
            console.log('No red dragon found in game');
        }
    };
    var forceAttackAnimation = function () {
        var redDragon = gameState === null || gameState === void 0 ? void 0 : gameState.players.flatMap(function (p) { return p.units; }).concat(gameState.enemyUnits || []).find(function (u) { return u.name.toLowerCase() === 'red dragon'; });
        if (redDragon && socket) {
            console.log("\uD83D\uDC09 Forcing attack animation for ".concat(redDragon.id));
            socket.emit('debug-dragon-attack', {
                dragonId: redDragon.id
            });
        }
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "Red Dragon Debug" }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "Trigger Flying (66%)", onPress: function () { return triggerDragonFlying('66%'); } }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "Trigger Flying (33%)", onPress: function () { return triggerDragonFlying('33%'); } }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "Force Attack Animation", onPress: forceAttackAnimation })] }));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        borderRadius: 5,
    },
    title: {
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
    },
});
exports.default = RedDragonDebug;
