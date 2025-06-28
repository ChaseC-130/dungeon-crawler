"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var GameContext_1 = require("../contexts/GameContext");
var UnitSpriteSimple_1 = __importDefault(require("./UnitSpriteSimple"));
var UnitSprite_1 = __importDefault(require("./UnitSprite"));
var UnifiedUnitSprite_1 = __importDefault(require("./UnifiedUnitSprite"));
var ShopPanel = function () {
    var _a = (0, GameContext_1.useGame)(), gameState = _a.gameState, player = _a.player, purchaseUnit = _a.purchaseUnit, rerollShop = _a.rerollShop;
    var _b = react_1.default.useState(null), draggedUnit = _b[0], setDraggedUnit = _b[1];
    var draggedUnitRef = react_1.default.useRef(null);
    if (!gameState || !player) {
        return null;
    }
    var canAffordReroll = player.gold >= 10;
    var handleDragStart = react_1.default.useCallback(function (unit, event) {
        if (player.gold < unit.cost)
            return;
        draggedUnitRef.current = unit;
        setDraggedUnit(unit);
        // For web, create a drag image
        if (react_native_1.Platform.OS === 'web' && event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData('unitType', unit.name);
            event.dataTransfer.setData('action', 'purchase');
            // Create custom drag image - make it invisible since we handle visuals in Phaser (NEW VERSION!)
            console.log('🛍️ NEW SHOP PANEL DRAG - INVISIBLE IMAGE!');
            var dragImage_1 = document.createElement('div');
            dragImage_1.style.position = 'absolute';
            dragImage_1.style.pointerEvents = 'none';
            dragImage_1.style.left = '-9999px';
            dragImage_1.style.width = '1px';
            dragImage_1.style.height = '1px';
            dragImage_1.style.background = 'transparent';
            dragImage_1.style.opacity = '0';
            document.body.appendChild(dragImage_1);
            event.dataTransfer.setDragImage(dragImage_1, 0, 0);
            setTimeout(function () { return document.body.removeChild(dragImage_1); }, 0);
        }
        // Enter placement mode in game
        if (window.gameInstance) {
            var scene = window.gameInstance.scene.getScene('MainScene');
            if (scene && scene.enterPlacementMode) {
                scene.enterPlacementMode(unit);
            }
        }
    }, [player.gold]);
    var handleDragEnd = react_1.default.useCallback(function () {
        draggedUnitRef.current = null;
        setDraggedUnit(null);
    }, []);
    var renderUnitCard = react_1.default.useCallback(function (unit) {
        var canAfford = player.gold >= unit.cost;
        return react_native_1.Platform.OS === 'web' ? ((0, jsx_runtime_1.jsx)("div", { draggable: canAfford, onDragStart: function (e) { return handleDragStart(unit, e); }, onDragEnd: handleDragEnd, style: {
                opacity: canAfford ? 1 : 0.6,
                cursor: canAfford ? 'grab' : 'not-allowed',
                userSelect: 'none',
            }, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.unitCard, !canAfford && styles.unitCardDisabled], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.unitHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unitName, children: unit.name }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.costContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.costIcon, children: "\uD83D\uDCB0" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.costText, !canAfford && styles.costTextDisabled], children: unit.cost })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unitImageContainer, children: react_native_1.Platform.OS === 'web' ? ((0, jsx_runtime_1.jsx)(UnitSprite_1.default, { unitName: unit.name, width: 80, height: 80, useGridCellSize: true })) : ((0, jsx_runtime_1.jsx)(UnitSpriteSimple_1.default, { unitName: unit.name, width: 80, height: 80, useGridCellSize: true })) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statsContainer, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\u2694\uFE0F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.damage }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "DMG" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\u2764\uFE0F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.health }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "HP" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\uD83C\uDFC3" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.movementSpeed }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "SPD" })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.typeContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.typeText, children: unit.attackType }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.typeText, children: unit.armorType })] }), unit.innatePassive && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.passiveText, numberOfLines: 2, children: unit.innatePassive })), canAfford && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.dragHint, children: "Drag to place" }))] }) }, unit.name)) : ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.unitCard, !canAfford && styles.unitCardDisabled], onPress: function () {
                if (canAfford && window.gameInstance) {
                    var scene = window.gameInstance.scene.getScene('MainScene');
                    if (scene && scene.enterPlacementMode) {
                        purchaseUnit(unit.name);
                    }
                }
            }, disabled: !canAfford, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.unitHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unitName, children: unit.name }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.costContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.costIcon, children: "\uD83D\uDCB0" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.costText, !canAfford && styles.costTextDisabled], children: unit.cost })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unitImageContainer, children: react_native_1.Platform.OS === 'web' ? ((0, jsx_runtime_1.jsx)(UnifiedUnitSprite_1.default, { unitName: unit.name, width: 80, height: 80 })) : ((0, jsx_runtime_1.jsx)(UnitSpriteSimple_1.default, { unitName: unit.name, width: 80, height: 80, useGridCellSize: true })) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statsContainer, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\u2694\uFE0F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.damage }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "DMG" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\u2764\uFE0F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.health }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "HP" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statIcon, children: "\uD83C\uDFC3" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statText, children: unit.movementSpeed }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: "SPD" })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.typeContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.typeText, children: unit.attackType }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.typeText, children: unit.armorType })] }), unit.innatePassive && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.passiveText, numberOfLines: 2, children: unit.innatePassive }))] }, unit.name));
    }, [player.gold, handleDragStart, handleDragEnd, purchaseUnit]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "SHOP" }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.rerollButton, !canAffordReroll && styles.rerollButtonDisabled], onPress: rerollShop, disabled: !canAffordReroll, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rerollIcon, children: "\uD83C\uDFB2" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rerollText, children: "Reroll (10g)" })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.scrollContent, children: gameState.shopUnits.map(renderUnitCard) })] }));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        padding: 15,
        maxHeight: 250,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    scrollContent: {
        paddingRight: 15,
    },
    unitCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginRight: 10,
        width: 160,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    unitCardDisabled: {
        opacity: 0.6,
    },
    unitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    unitName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    costIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    costText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    costTextDisabled: {
        color: '#999',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statRow: {
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 16,
        marginBottom: 2,
    },
    statText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statLabel: {
        color: '#AAA',
        fontSize: 10,
        marginTop: 2,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    typeText: {
        color: '#AAA',
        fontSize: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    passiveText: {
        color: '#4CAF50',
        fontSize: 11,
        fontStyle: 'italic',
    },
    unitImageContainer: {
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        // Container will adjust to sprite size automatically
    },
    unitImage: {
        width: 60,
        height: 60,
    },
    rerollButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    rerollButtonDisabled: {
        opacity: 0.5,
        borderColor: '#666',
    },
    rerollIcon: {
        fontSize: 18,
        marginRight: 5,
    },
    rerollText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    dragHint: {
        color: '#4CAF50',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
    },
});
exports.default = ShopPanel;
