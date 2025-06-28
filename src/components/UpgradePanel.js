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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var GameContext_1 = require("../contexts/GameContext");
var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
var isSmallScreen = width < 768;
var isMediumScreen = width >= 768 && width < 1024;
// Map upgrade names to icon files
var UPGRADE_ICONS = {
    'Vampiric Strike': require('../../assets/upgradeicons/vampiric_strike.png'),
    'Swift Boots': require('../../assets/upgradeicons/swift_boots.png'),
    'Vitality Boost': require('../../assets/upgradeicons/vitality_boost.png'),
    'Power Surge': require('../../assets/upgradeicons/power_surge.png'),
    'Rapid Strikes': require('../../assets/upgradeicons/rapid_strikes.png'),
    'Evasive Maneuvers': require('../../assets/upgradeicons/evasive_maneuvers.png'),
    'Taunt': require('../../assets/upgradeicons/taunt.png'),
    'Final Gift': require('../../assets/upgradeicons/final_gift.png'),
    'Explosive End': require('../../assets/upgradeicons/explosive_end.png'),
    'Poison Blade': require('../../assets/upgradeicons/poison_blade.png'),
    'Slowing Aura': require('../../assets/upgradeicons/slowing_aura.png'),
};
var UpgradePanel = function (_a) {
    var onClose = _a.onClose;
    var _b = (0, GameContext_1.useGame)(), gameState = _b.gameState, player = _b.player, selectUpgrade = _b.selectUpgrade, rerollShop = _b.rerollShop;
    // State for the current view mode
    var _c = (0, react_1.useState)('cards'), viewMode = _c[0], setViewMode = _c[1];
    var _d = (0, react_1.useState)(null), selectedCard = _d[0], setSelectedCard = _d[1];
    var _e = (0, react_1.useState)(null), hoveredUnitType = _e[0], setHoveredUnitType = _e[1];
    // Get player's upgrade cards - limit to 1 high-potency and up to 3 normal upgrades
    var allUpgradeCards = (player === null || player === void 0 ? void 0 : player.upgradeCards) || [];
    // Reset state when upgrade cards change (indicating an upgrade was applied)
    var prevUpgradeCardIds = react_1.default.useRef('');
    react_1.default.useEffect(function () {
        var currentCardIds = allUpgradeCards.map(function (c) { return c.id; }).sort().join(',');
        if (prevUpgradeCardIds.current && prevUpgradeCardIds.current !== currentCardIds) {
            console.log('UpgradePanel: Upgrade cards changed, resetting state');
            setViewMode('cards');
            setSelectedCard(null);
            setHoveredUnitType(null);
        }
        prevUpgradeCardIds.current = currentCardIds;
    }, [allUpgradeCards]);
    // Clear selection if the selected card is no longer available
    react_1.default.useEffect(function () {
        if (selectedCard && !allUpgradeCards.find(function (c) { return c.id === selectedCard.id; })) {
            console.log('UpgradePanel: Selected card no longer available, clearing selection');
            setSelectedCard(null);
            setViewMode('cards');
        }
    }, [selectedCard, allUpgradeCards]);
    console.log('UpgradePanel: All upgrade cards:', allUpgradeCards.length, allUpgradeCards.map(function (c) { return ({ id: c.id, name: c.name, isHighPotency: c.isHighPotency }); }));
    var highPotencyCards = allUpgradeCards.filter(function (card) { return card.isHighPotency; }).slice(0, 1);
    var normalCards = allUpgradeCards.filter(function (card) { return !card.isHighPotency; }).slice(0, 3);
    var upgradeCards = __spreadArray(__spreadArray([], highPotencyCards, true), normalCards, true);
    console.log('UpgradePanel: Displayed upgrade cards:', upgradeCards.length, upgradeCards.map(function (c) { return ({ id: c.id, name: c.name }); }));
    // Calculate responsive card dimensions based on screen size
    var numberOfCards = upgradeCards.length || 4;
    var cardMargin = isSmallScreen ? 6 : 10;
    var containerPadding = isSmallScreen ? 15 : 25;
    var availableWidth = width - containerPadding * 2;
    // Adjust card sizes based on screen size
    var maxCardWidth = isSmallScreen ? 180 : isMediumScreen ? 220 : 260;
    var minCardWidth = isSmallScreen ? 140 : isMediumScreen ? 160 : 180;
    var calculatedWidth = (availableWidth - (cardMargin * (numberOfCards - 1))) / numberOfCards;
    var cardWidth = Math.min(maxCardWidth, Math.max(minCardWidth, calculatedWidth));
    // Calculate responsive font sizes
    var titleFontSize = isSmallScreen ? 20 : 26;
    var cardNameFontSize = isSmallScreen ? 14 : 16;
    var cardDescFontSize = isSmallScreen ? 12 : 14;
    var iconSize = isSmallScreen ? 50 : 65;
    if (!gameState || !player) {
        return null;
    }
    // Don't show panel if no upgrade cards available
    if (!upgradeCards || upgradeCards.length === 0) {
        return null;
    }
    var canAffordReroll = player.gold >= 10;
    var ownedUnitTypes = Array.from(new Set(player.units.map(function (u) { return u.name; })));
    var handleUpgradeSelect = function (card) {
        console.log('UpgradePanel: handleUpgradeSelect called', {
            cardId: card.id,
            cardName: card.name,
            isHighPotency: card.isHighPotency,
            targetUnitType: card.targetUnitType,
        });
        if (card.isHighPotency) {
            // High potency upgrades are auto-assigned
            console.log('UpgradePanel: Selecting high-potency upgrade directly');
            console.log('UpgradePanel: About to call selectUpgrade with:', card.id);
            try {
                selectUpgrade(card.id);
                console.log('UpgradePanel: selectUpgrade called successfully');
            }
            catch (error) {
                console.error('UpgradePanel: Error calling selectUpgrade:', error);
            }
            // Don't close or change view - let the user continue selecting if they have more cards
        }
        else {
            // Normal upgrades need unit type selection
            console.log('UpgradePanel: Switching to unit type selection');
            setSelectedCard(card);
            setViewMode('unitSelection');
        }
    };
    var handleUnitTypeSelect = function (unitType) {
        console.log('UpgradePanel: handleUnitTypeSelect called', {
            selectedCard: selectedCard === null || selectedCard === void 0 ? void 0 : selectedCard.id,
            unitType: unitType,
        });
        if (selectedCard) {
            console.log('UpgradePanel: About to call selectUpgrade with:', { upgradeId: selectedCard.id, unitType: unitType });
            try {
                selectUpgrade(selectedCard.id, unitType);
                console.log('UpgradePanel: selectUpgrade called successfully for normal upgrade');
            }
            catch (error) {
                console.error('UpgradePanel: Error calling selectUpgrade:', error);
            }
            // Reset to card view for next selection
            setSelectedCard(null);
            setViewMode('cards');
        }
    };
    var handleCancel = function () {
        console.log('UpgradePanel: Cancelling unit type selection');
        setSelectedCard(null);
        setViewMode('cards');
    };
    var renderUpgradeCard = function (card) {
        var isSelected = (selectedCard === null || selectedCard === void 0 ? void 0 : selectedCard.id) === card.id;
        return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [
                styles.upgradeCard,
                card.isHighPotency && styles.highPotencyCard,
                isSelected && styles.selectedCard,
                { width: cardWidth }
            ], onPress: function () { return handleUpgradeSelect(card); }, children: [card.isHighPotency && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.highPotencyBadge, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.highPotencyText, children: "\u00D73 POWER" }) })), UPGRADE_ICONS[card.name] && ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: UPGRADE_ICONS[card.name], style: [styles.upgradeIcon, { width: iconSize, height: iconSize }], resizeMode: "contain" })), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.upgradeName, { fontSize: cardNameFontSize }], children: card.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.upgradeDescription, { fontSize: cardDescFontSize }], children: card.description }), card.targetUnitType && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.targetContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.targetLabel, children: "Auto-assigned to:" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.targetUnit, children: card.targetUnitType })] }))] }, card.id));
    };
    // Unit selection view
    if (viewMode === 'unitSelection' && selectedCard) {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.scrollContainer, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "SELECT UNIT TYPE" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.subtitle, children: ["Choose which unit type to upgrade with ", selectedCard.name] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unitTypeContainer, children: ownedUnitTypes.map(function (unitType) {
                            var unitTypeWidth = Math.max(120, Math.min(200, (availableWidth - (12 * (ownedUnitTypes.length - 1))) / ownedUnitTypes.length));
                            var sampleUnit = player.units.find(function (u) { return u.name === unitType; });
                            return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.unitTypeButton, { width: unitTypeWidth }, hoveredUnitType === unitType && styles.unitTypeButtonHover], onPress: function () { return handleUnitTypeSelect(unitType); }, onPressIn: function () { return setHoveredUnitType(unitType); }, onPressOut: function () { return setHoveredUnitType(null); }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unitTypeText, children: unitType }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unitCount, children: [player.units.filter(function (u) { return u.name === unitType; }).length, " owned"] }), sampleUnit && hoveredUnitType === unitType && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.unitTooltip, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipText, children: ["HP: ", sampleUnit.health, "/", sampleUnit.maxHealth] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipText, children: ["Damage: ", sampleUnit.damage] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipText, children: ["Attack Speed: ", sampleUnit.attackSpeed.toFixed(1)] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipText, children: ["Range: ", sampleUnit.range] })] }))] }, unitType));
                        }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.cancelButton, onPress: handleCancel, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cancelText, children: "CANCEL" }) })] }) }));
    }
    // Main card selection view
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.scrollContainer, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.title, { fontSize: titleFontSize }], children: "Choose Your Upgrades" }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.rerollButton, !canAffordReroll && styles.rerollButtonDisabled], onPress: rerollShop, disabled: !canAffordReroll, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rerollIcon, children: "\uD83C\uDFB2" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rerollText, children: "Reroll Upgrades (10)" })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.upgradeContainer, children: upgradeCards.map(renderUpgradeCard) })] }) }));
};
var styles = react_native_1.StyleSheet.create({
    scrollContainer: {
        maxHeight: Math.min(height * 0.8, 600),
    },
    container: {
        padding: 15,
        paddingBottom: 25,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        color: '#CCC',
        fontSize: 14,
        marginBottom: 15,
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
    upgradeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        paddingHorizontal: 5,
    },
    upgradeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 15,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        minHeight: 180,
    },
    unitTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    highPotencyCard: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: '#FFD700',
    },
    selectedCard: {
        borderColor: '#4CAF50',
        borderWidth: 3,
    },
    highPotencyBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 6,
    },
    highPotencyText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    upgradeIcon: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    upgradeName: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    upgradeDescription: {
        color: '#CCC',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },
    targetContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    targetLabel: {
        color: '#AAA',
        fontSize: 12,
    },
    targetUnit: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    unitTypeButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderRadius: 10,
        padding: 12,
        marginRight: 8,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    unitTypeText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    unitCount: {
        color: '#AAA',
        fontSize: 12,
    },
    cancelButton: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F44336',
        alignSelf: 'center',
        paddingHorizontal: 30,
    },
    cancelText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    unitTypeButtonHover: {
        backgroundColor: 'rgba(76, 175, 80, 0.4)',
        borderColor: '#81C784',
    },
    unitTooltip: {
        position: 'absolute',
        top: -120,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
        zIndex: 1000,
    },
    tooltipText: {
        color: '#FFF',
        fontSize: 12,
        marginBottom: 2,
    },
});
exports.default = UpgradePanel;
