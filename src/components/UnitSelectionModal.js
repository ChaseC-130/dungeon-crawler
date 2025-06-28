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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var UnitSpriteSimple_1 = __importDefault(require("./UnitSpriteSimple"));
var UnifiedUnitSprite_1 = __importDefault(require("./UnifiedUnitSprite"));
// Unit stats - should match server
var UNIT_STATS = {
    knight: {
        name: 'Knight',
        cost: 3,
        health: 1200,
        maxHealth: 1200,
        damage: 15,
        attackSpeed: 0.8,
        movementSpeed: 1.0,
        range: 1,
        priority: 3,
        attackType: 'Physical',
        armorType: 'Heavy',
        innatePassive: 'Tank: Reduces damage taken by 20%'
    },
    priest: {
        name: 'Priest',
        cost: 4,
        health: 800,
        maxHealth: 800,
        damage: 10,
        attackSpeed: 1.0,
        movementSpeed: 1.0,
        range: 3,
        priority: 5,
        attackType: 'Magical',
        armorType: 'Light',
        innatePassive: 'Healer: Heals lowest HP ally for 15 HP every 2 seconds'
    },
    bishop: {
        name: 'Bishop',
        cost: 5,
        health: 1000,
        maxHealth: 1000,
        damage: 20,
        attackSpeed: 1.2,
        movementSpeed: 0.8,
        range: 3,
        priority: 4,
        attackType: 'Magical',
        armorType: 'Light',
        innatePassive: 'Holy Shield: Grants 10% damage reduction to nearby allies'
    },
    fighter: {
        name: 'Fighter',
        cost: 2,
        health: 800,
        maxHealth: 800,
        damage: 20,
        attackSpeed: 1.2,
        movementSpeed: 1.2,
        range: 1,
        priority: 2,
        attackType: 'Physical',
        armorType: 'Light',
        innatePassive: 'Berserker: +20% attack speed when below 50% HP'
    },
    goblin: {
        name: 'Goblin',
        cost: 1,
        health: 500,
        maxHealth: 500,
        damage: 15,
        attackSpeed: 1.5,
        movementSpeed: 1.5,
        range: 1,
        priority: 1,
        attackType: 'Physical',
        armorType: 'Light',
        innatePassive: 'Swarm: +5% damage for each allied Goblin'
    },
    wizard: {
        name: 'Wizard',
        cost: 4,
        health: 700,
        maxHealth: 700,
        damage: 25,
        attackSpeed: 0.8,
        movementSpeed: 1.0,
        range: 4,
        priority: 4,
        attackType: 'Magical',
        armorType: 'Light',
        innatePassive: 'Arcane Power: Deals splash damage to nearby enemies'
    },
    gladiator: {
        name: 'Gladiator',
        cost: 3,
        health: 1000,
        maxHealth: 1000,
        damage: 18,
        attackSpeed: 1.0,
        movementSpeed: 1.1,
        range: 1,
        priority: 2,
        attackType: 'Physical',
        armorType: 'Heavy',
        innatePassive: 'Bloodthirst: Heals for 20% of damage dealt'
    },
    'red dragon': {
        name: 'Red Dragon',
        cost: 6,
        health: 1800,
        maxHealth: 1800,
        damage: 25,
        attackSpeed: 0.75,
        movementSpeed: 1.0,
        range: 3,
        priority: 1,
        attackType: 'Magical',
        armorType: 'Heavy',
        innatePassive: 'Flying: Becomes untargetable at 66% and 33% health for 5 seconds'
    }
};
var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
var UnitSelectionModal = function (_a) {
    var visible = _a.visible, onComplete = _a.onComplete;
    var _b = (0, react_1.useState)([]), selectedUnits = _b[0], setSelectedUnits = _b[1];
    var _c = (0, react_1.useState)(null), hoveredUnit = _c[0], setHoveredUnit = _c[1];
    var maxUnits = 5;
    // Debug UNIT_STATS structure
    console.log('UNIT_STATS object:', UNIT_STATS);
    console.log('UNIT_STATS keys:', Object.keys(UNIT_STATS));
    console.log('Red Dragon entry:', UNIT_STATS['red dragon']);
    var allUnits = Object.entries(UNIT_STATS).map(function (_a) {
        var key = _a[0], stats = _a[1];
        return (__assign(__assign({}, stats), { key: key, name: stats.name }));
    });
    console.log('All units from UNIT_STATS:', allUnits.map(function (u) { return "".concat(u.name, " (key: ").concat(u.key, ")"); }));
    // Calculate responsive grid layout for 20+ cards
    var containerPadding = 40;
    var cardMargin = 12;
    var availableWidth = width * 0.9 - containerPadding;
    var cardsPerRow = Math.min(6, Math.max(3, Math.floor(width / 200))); // 3-6 cards per row for larger cards
    var cardWidth = Math.min(240, (availableWidth - (cardMargin * (cardsPerRow - 1))) / cardsPerRow);
    var toggleUnit = function (unitName) {
        if (selectedUnits.includes(unitName)) {
            setSelectedUnits(selectedUnits.filter(function (u) { return u !== unitName; }));
        }
        else if (selectedUnits.length < maxUnits) {
            setSelectedUnits(__spreadArray(__spreadArray([], selectedUnits, true), [unitName], false));
        }
    };
    var handleConfirm = function () {
        if (selectedUnits.length === maxUnits) {
            onComplete(selectedUnits);
        }
    };
    var renderUnitCard = function (unit) {
        var isSelected = selectedUnits.includes(unit.key);
        var canSelect = selectedUnits.length < maxUnits || isSelected;
        var isHovered = hoveredUnit === unit.key;
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.cardContainer, children: [(0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [
                        styles.unitCard,
                        isSelected && styles.unitCardSelected,
                        !canSelect && styles.unitCardDisabled,
                        { width: cardWidth }
                    ], onPress: function () { return toggleUnit(unit.key); }, onPressIn: function () { return setHoveredUnit(unit.key); }, onPressOut: function () { return setHoveredUnit(null); }, disabled: !canSelect, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unitName, children: unit.name }), isSelected && (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.checkmark, children: "\u2713" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unitImageContainer, children: react_native_1.Platform.OS === 'web' ? ((0, jsx_runtime_1.jsx)(UnifiedUnitSprite_1.default, { unitName: unit.key, width: 360, height: 360 })) : ((0, jsx_runtime_1.jsx)(UnitSpriteSimple_1.default, { unitName: unit.key, width: 360, height: 360, useGridCellSize: true })) })] }), isHovered && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tooltip, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tooltipTitle, children: unit.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tooltipPassive, children: unit.innatePassive })] }))] }, unit.key));
    };
    return ((0, jsx_runtime_1.jsx)(react_native_1.Modal, { visible: visible, animationType: "fade", transparent: true, onRequestClose: function () { }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.modalOverlay, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.modalContent, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "Choose Your Starting Units" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.subtitle, children: ["Select ", maxUnits, " units (", selectedUnits.length, "/", maxUnits, ")"] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: [styles.subtitle, { color: 'yellow', fontSize: 16 }], children: ["DEBUG: ", allUnits.length, " units available: ", allUnits.map(function (u) { return "".concat(u.name, " (").concat(u.key, ")"); }).join(', ')] }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: styles.scrollContainer, contentContainerStyle: styles.unitsGrid, children: allUnits.map(function (unit, index) {
                            console.log("Rendering unit ".concat(index + 1, ": ").concat(unit.name, " (key: ").concat(unit.key, ")"));
                            return renderUnitCard(unit);
                        }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [
                            styles.confirmButton,
                            selectedUnits.length !== maxUnits && styles.confirmButtonDisabled
                        ], onPress: handleConfirm, disabled: selectedUnits.length !== maxUnits, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.confirmButtonText, children: "Start Game" }) })] }) }) }));
};
var styles = react_native_1.StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 20,
        width: width * 0.95,
        maxHeight: height * 0.9,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollContainer: {
        maxHeight: height * 0.65,
    },
    unitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingBottom: 20,
    },
    cardContainer: {
        position: 'relative',
    },
    unitCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        margin: 6,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 440,
    },
    unitCardSelected: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    unitCardDisabled: {
        opacity: 0.5,
    },
    unitName: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    checkmark: {
        position: 'absolute',
        top: 16,
        right: 16,
        color: '#FFD700',
        fontSize: 36,
        fontWeight: 'bold',
    },
    unitImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    tooltip: {
        position: 'absolute',
        top: -150,
        left: '50%',
        transform: [{ translateX: -120 }],
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 2,
        borderColor: '#FFD700',
        zIndex: 1000,
        width: 240,
    },
    tooltipTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    tooltipPassive: {
        color: '#AAA',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 10,
        borderWidth: 2,
        borderColor: '#2E7D32',
    },
    confirmButtonDisabled: {
        backgroundColor: '#666',
        borderColor: '#444',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
exports.default = UnitSelectionModal;
