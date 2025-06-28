"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
var MainMenu = function () {
    var navigation = (0, native_1.useNavigation)();
    var handlePlayPress = function () {
        navigation.navigate('Lobby');
    };
    return ((0, jsx_runtime_1.jsx)(react_native_1.ImageBackground, { source: require('../../assets/backgrounds/battle1.png'), style: styles.background, resizeMode: "cover", children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.titleContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "DUNGEON" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "CRAWLER" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.subtitle, children: "Autobattler Adventure" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.button, onPress: handlePlayPress, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "PLAY" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.button, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "TUTORIAL" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.button, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "SETTINGS" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.button, styles.exitButton], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.buttonText, children: "EXIT" }) })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.version, children: "Version 1.0.0" })] }) }));
};
var styles = react_native_1.StyleSheet.create({
    background: {
        flex: 1,
        width: width,
        height: height,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    titleContainer: {
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFD700',
        textShadowColor: '#000',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 5,
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 20,
        color: '#FFF',
        marginTop: 10,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    menuContainer: {
        width: 300,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    exitButton: {
        backgroundColor: '#B71C1C',
        borderColor: '#7F0000',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
    },
    version: {
        position: 'absolute',
        bottom: 20,
        color: '#AAA',
        fontSize: 12,
    },
});
exports.default = MainMenu;
