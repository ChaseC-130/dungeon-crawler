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
var native_1 = require("@react-navigation/native");
var GameContext_1 = require("../contexts/GameContext");
var Lobby = function () {
    var navigation = (0, native_1.useNavigation)();
    var _a = (0, GameContext_1.useGame)(), joinMatch = _a.joinMatch, gameState = _a.gameState, player = _a.player, isConnected = _a.isConnected, socket = _a.socket;
    var _b = (0, react_1.useState)(''), playerName = _b[0], setPlayerName = _b[1];
    var _c = (0, react_1.useState)(false), isJoining = _c[0], setIsJoining = _c[1];
    (0, react_1.useEffect)(function () {
        if (!socket)
            return;
        var handleMatchStarted = function (matchId) {
            navigation.navigate('Game', { matchId: matchId });
        };
        socket.on('match-started', handleMatchStarted);
        return function () {
            socket.off('match-started', handleMatchStarted);
        };
    }, [socket, navigation]);
    var handleJoinMatch = function () {
        if (!playerName.trim()) {
            react_native_1.Alert.alert('Error', 'Please enter your name');
            return;
        }
        if (!isConnected) {
            react_native_1.Alert.alert('Error', 'Not connected to server');
            return;
        }
        setIsJoining(true);
        joinMatch(playerName);
    };
    var renderPlayer = function (_a) {
        var item = _a.item;
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.playerItem, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.playerName, { color: item.color || '#FFF' }], children: item.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.playerStatus, children: item.isReady ? '✓ Ready' : 'Waiting...' })] }));
    };
    if (isJoining && gameState) {
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "Waiting for Players" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.subtitle, children: [gameState.players.length, "/4 Players"] }), (0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: gameState.players, renderItem: renderPlayer, keyExtractor: function (item) { return item.id; }, style: styles.playerList }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.button, onPress: function () {
                        setIsJoining(false);
                        // TODO: Leave match
                    }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "LEAVE LOBBY" }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "Join Game" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.inputContainer, children: (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.input, placeholder: "Enter your name", placeholderTextColor: "#999", value: playerName, onChangeText: setPlayerName, maxLength: 20 }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.buttonContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.button, onPress: handleJoinMatch, disabled: !isConnected, children: !isConnected ? ((0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: "#FFF" })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "FIND MATCH" })) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.button, styles.secondaryButton], onPress: function () { return react_native_1.Alert.alert('Coming Soon', 'Private matches coming soon!'); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "JOIN WITH CODE" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.button, styles.backButton], onPress: function () { return navigation.goBack(); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "BACK" }) })] }), !isConnected && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.connectionStatus, children: "Connecting to server..." }))] }));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 20,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 20,
        color: '#FFF',
        marginBottom: 30,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#16213e',
        borderRadius: 8,
        padding: 15,
        fontSize: 18,
        color: '#FFF',
        borderWidth: 2,
        borderColor: '#0f3460',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    button: {
        width: '100%',
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 30,
        marginVertical: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#1B5E20',
        elevation: 5,
    },
    secondaryButton: {
        backgroundColor: '#1565C0',
        borderColor: '#0D47A1',
    },
    backButton: {
        backgroundColor: '#616161',
        borderColor: '#424242',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
    },
    playerList: {
        width: '100%',
        maxWidth: 400,
        marginVertical: 20,
    },
    playerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#16213e',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    playerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    playerStatus: {
        color: '#4CAF50',
        fontSize: 14,
    },
    connectionStatus: {
        position: 'absolute',
        bottom: 20,
        color: '#FF9800',
        fontSize: 14,
    },
});
exports.default = Lobby;
