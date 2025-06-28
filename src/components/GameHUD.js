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
var GameContext_1 = require("../contexts/GameContext");
var ShopPanel_1 = __importDefault(require("./ShopPanel"));
var UpgradePanel_1 = __importDefault(require("./UpgradePanel"));
var GameHUD = function () {
    var _a, _b;
    var _c = (0, GameContext_1.useGame)(), gameState = _c.gameState, player = _c.player, setReady = _c.setReady;
    var _d = react_1.default.useState(false), showGridToggle = _d[0], setShowGridToggle = _d[1];
    var _e = (0, react_1.useState)(false), showPlayerTooltip = _e[0], setShowPlayerTooltip = _e[1];
    var _f = (0, react_1.useState)(false), showUpgradePanel = _f[0], setShowUpgradePanel = _f[1];
    var _g = (0, react_1.useState)(false), isFullscreen = _g[0], setIsFullscreen = _g[1];
    var _h = (0, react_1.useState)(false), isDragging = _h[0], setIsDragging = _h[1];
    var pulseAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    // Fullscreen toggle handler
    var toggleFullscreen = react_1.default.useCallback(function () {
        if (typeof window !== 'undefined' && window.gameInstance) {
            var game = window.gameInstance;
            if (game && game.scale) {
                if (game.scale.isFullscreen) {
                    game.scale.stopFullscreen();
                    setIsFullscreen(false);
                }
                else {
                    game.scale.startFullscreen();
                    setIsFullscreen(true);
                }
            }
        }
    }, []);
    // Listen for fullscreen changes
    react_1.default.useEffect(function () {
        if (typeof window !== 'undefined' && window.gameInstance) {
            var game_1 = window.gameInstance;
            if (game_1 && game_1.scale) {
                var handleEnterFullscreen_1 = function () { return setIsFullscreen(true); };
                var handleLeaveFullscreen_1 = function () { return setIsFullscreen(false); };
                game_1.scale.on('enterfullscreen', handleEnterFullscreen_1);
                game_1.scale.on('leavefullscreen', handleLeaveFullscreen_1);
                return function () {
                    game_1.scale.off('enterfullscreen', handleEnterFullscreen_1);
                    game_1.scale.off('leavefullscreen', handleLeaveFullscreen_1);
                };
            }
        }
    }, []);
    // Monitor drag state from game instance
    react_1.default.useEffect(function () {
        var checkDragState = function () {
            var currentDragState = typeof window !== 'undefined' && window.isDragging;
            setIsDragging(!!currentDragState);
        };
        // Check initial state
        checkDragState();
        // Set up polling to monitor drag state changes
        var interval = setInterval(checkDragState, 100);
        return function () { return clearInterval(interval); };
    }, []);
    // Reset upgrade panel visibility when phase changes
    react_1.default.useEffect(function () {
        // Always reset panel when phase changes
        setShowUpgradePanel(false);
    }, [gameState === null || gameState === void 0 ? void 0 : gameState.phase]);
    // Close upgrade panel when an upgrade is successfully applied (card count decreases)
    var prevUpgradeCardCount = (0, react_1.useRef)(((_a = player === null || player === void 0 ? void 0 : player.upgradeCards) === null || _a === void 0 ? void 0 : _a.length) || 0);
    react_1.default.useEffect(function () {
        var _a;
        var currentCount = ((_a = player === null || player === void 0 ? void 0 : player.upgradeCards) === null || _a === void 0 ? void 0 : _a.length) || 0;
        // Debug logging
        console.log('GameHUD: Upgrade card count change detected', {
            currentCount: currentCount,
            previousCount: prevUpgradeCardCount.current,
            showUpgradePanel: showUpgradePanel,
            cardCountDecreased: currentCount < prevUpgradeCardCount.current
        });
        // Only close if there are no more upgrade cards at all
        if (showUpgradePanel && currentCount === 0) {
            console.log('GameHUD: Closing upgrade panel - no more upgrade cards');
            setShowUpgradePanel(false);
        }
        prevUpgradeCardCount.current = currentCount;
    }, [(_b = player === null || player === void 0 ? void 0 : player.upgradeCards) === null || _b === void 0 ? void 0 : _b.length, showUpgradePanel]);
    // Force close upgrade panel function
    var forceCloseUpgradePanel = react_1.default.useCallback(function () {
        console.log('GameHUD: Force closing upgrade panel');
        setShowUpgradePanel(false);
    }, []);
    // Pulsing animation for upgrade button
    react_1.default.useEffect(function () {
        if ((gameState === null || gameState === void 0 ? void 0 : gameState.phase) === 'post-combat' && (player === null || player === void 0 ? void 0 : player.upgradeCards) && player.upgradeCards.length > 0 && !showUpgradePanel) {
            var pulseAnimation_1 = react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]));
            pulseAnimation_1.start();
            return function () { return pulseAnimation_1.stop(); };
        }
        else {
            pulseAnim.setValue(1);
        }
    }, [gameState === null || gameState === void 0 ? void 0 : gameState.phase, player === null || player === void 0 ? void 0 : player.upgradeCards, showUpgradePanel, pulseAnim]);
    if (!gameState || !player) {
        return null;
    }
    // Get unit counts by type
    var getUnitCounts = function () {
        var counts = {};
        player.units.forEach(function (unit) {
            counts[unit.name] = (counts[unit.name] || 0) + 1;
        });
        return counts;
    };
    // Get all upgrades applied to player's units
    var getAllUpgrades = function () {
        var upgrades = {};
        player.units.forEach(function (unit) {
            if (unit.buffs && unit.buffs.length > 0) {
                var unitUpgrades = unit.buffs.map(function (buff) {
                    // Convert buff type to readable upgrade name
                    switch (buff.type) {
                        case 'lifesteal': return 'Vampiric Strike';
                        case 'movementSpeed': return 'Swift Boots';
                        case 'health': return 'Vitality Boost';
                        case 'damage': return 'Power Surge';
                        case 'attackSpeed': return 'Rapid Strikes';
                        case 'priority': return buff.value > 0 ? 'Evasive Maneuvers' : 'Taunt';
                        case 'deathHeal': return 'Final Gift';
                        case 'deathExplosion': return 'Explosive End';
                        case 'poison': return 'Poison Blade';
                        case 'slowAura': return 'Slowing Aura';
                        default: return buff.type;
                    }
                });
                upgrades[unit.name] = unitUpgrades;
            }
        });
        return upgrades;
    };
    var renderPhaseInfo = function () {
        switch (gameState.phase) {
            case 'preparation':
                return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.phaseContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.phaseText, children: "Preparation Phase" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.floorText, children: ["Floor ", gameState.currentFloor, "/10"] }), gameState.preparationTimeLeft > 0 && ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: [
                                styles.timerText,
                                gameState.preparationTimeLeft <= 10 && styles.timerTextRed,
                                gameState.preparationTimeLeft <= 30 && gameState.preparationTimeLeft > 10 && styles.timerTextOrange
                            ], children: [gameState.preparationTimeLeft, "s"] })), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.readyButton, player.isReady && styles.readyButtonActive], onPress: setReady, disabled: player.isReady, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.readyButtonText, children: player.isReady ? 'READY!' : 'READY' }) })] }));
            case 'combat':
                return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.phaseContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.phaseText, children: "Combat Phase" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.floorText, children: ["Floor ", gameState.currentFloor, "/10"] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.gridToggleButton, onPress: function () {
                                // Emit event to toggle grid
                                if (window.gameInstance) {
                                    var scene = window.gameInstance.scene.getScene('MainScene');
                                    if (scene && scene.grid) {
                                        scene.grid.toggleGridVisibility();
                                    }
                                }
                            }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.gridToggleText, children: "Toggle Grid" }) })] }));
            case 'post-combat':
                return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.phaseContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.phaseText, children: "Victory!" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.floorText, children: "Choose Upgrades" })] }));
            case 'game-over':
                return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.phaseContainer, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.phaseText, children: gameState.winner === 'players' ? 'Victory!' : 'Defeat' }) }));
        }
    };
    // Get unplaced units
    var unplacedUnits = player.units.filter(function (unit) { return !unit.position; });
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.topHUD, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.goldContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.goldIcon, children: "\uD83D\uDCB0" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.goldText, children: player.gold })] }), renderPhaseInfo(), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.playerInfo, onPress: function () { return setShowPlayerTooltip(true); }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.playerName, { color: player.color || '#FFF' }], children: player.name }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unitCount, children: ["Units: ", player.units.length] })] }), typeof window !== 'undefined' && ((0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.fullscreenButton, onPress: toggleFullscreen, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fullscreenButtonText, children: isFullscreen ? '↙' : '↗' }) }))] }), unplacedUnits.length > 0 && gameState.phase === 'preparation' && !isDragging && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.unplacedUnitsContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unplacedUnitsTitle, children: "Unplaced Units (Click to place):" }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, style: styles.unplacedUnitsScroll, children: unplacedUnits.map(function (unit) { return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.unplacedUnit, onPress: function () {
                                if (window.gameInstance) {
                                    var scene = window.gameInstance.scene.getScene('MainScene');
                                    if (scene && scene.enterPlacementModeForUnit) {
                                        scene.enterPlacementModeForUnit(unit);
                                    }
                                }
                            }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unplacedUnitName, children: unit.name }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unplacedUnitStats, children: ["\u2694\uFE0F", unit.damage, " \u2764\uFE0F", unit.health] })] }, unit.id)); }) })] })), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.bottomHUD, children: [gameState.phase === 'preparation' && (0, jsx_runtime_1.jsx)(ShopPanel_1.default, {}), gameState.phase === 'post-combat' && showUpgradePanel && (player === null || player === void 0 ? void 0 : player.upgradeCards) && player.upgradeCards.length > 0 && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.compactUpgradeContainer, children: [(0, jsx_runtime_1.jsx)(UpgradePanel_1.default, { onClose: forceCloseUpgradePanel }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.closeUpgradeButton, onPress: forceCloseUpgradePanel, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.closeUpgradeText, children: "Close" }) })] }))] }), gameState.phase === 'post-combat' && (player === null || player === void 0 ? void 0 : player.upgradeCards) && player.upgradeCards.length > 0 && !showUpgradePanel && ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bottomRightUpgradeButton, { transform: [{ scale: pulseAnim }] }], children: (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.bottomRightUpgradeButtonInner, onPress: function () {
                        var _a;
                        console.log('GameHUD: Opening upgrade panel', { upgradeCardsCount: (_a = player === null || player === void 0 ? void 0 : player.upgradeCards) === null || _a === void 0 ? void 0 : _a.length });
                        setShowUpgradePanel(true);
                    }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.upgradeAvailableText, children: "Select Upgrade" }) }) })), (0, jsx_runtime_1.jsx)(react_native_1.Modal, { visible: showPlayerTooltip, transparent: true, animationType: "fade", onRequestClose: function () { return setShowPlayerTooltip(false); }, children: (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.modalOverlay, onPress: function () { return setShowPlayerTooltip(false); }, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tooltipContainer, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipTitle, children: [player.name, "'s Army"] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tooltipSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tooltipSectionTitle, children: "Unit Counts:" }), Object.entries(getUnitCounts()).map(function (_a) {
                                        var unitType = _a[0], count = _a[1];
                                        return ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipItem, children: ["\u2022 ", unitType, ": ", count] }, unitType));
                                    })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tooltipSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tooltipSectionTitle, children: "Upgrades:" }), Object.keys(getAllUpgrades()).length > 0 ? (Object.entries(getAllUpgrades()).map(function (_a) {
                                        var unitType = _a[0], upgrades = _a[1];
                                        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.upgradeGroup, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.upgradeUnitType, children: [unitType, ":"] }), upgrades.map(function (upgrade, index) { return ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tooltipItem, children: ["\u2022 ", upgrade] }, index)); })] }, unitType));
                                    })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tooltipItem, children: "No upgrades yet" }))] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.closeButton, onPress: function () { return setShowPlayerTooltip(false); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.closeButtonText, children: "Close" }) })] }) }) })] }));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none',
        zIndex: 100,
    },
    topHUD: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        paddingTop: 40, // Account for status bar
    },
    goldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    goldIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    goldText: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
    },
    phaseContainer: {
        alignItems: 'center',
    },
    phaseText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    floorText: {
        color: '#CCC',
        fontSize: 14,
        marginTop: 4,
    },
    readyButton: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
        borderWidth: 2,
        borderColor: '#1B5E20',
    },
    readyButtonActive: {
        backgroundColor: '#66BB6A',
        borderColor: '#4CAF50',
    },
    readyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    playerInfo: {
        alignItems: 'flex-end',
    },
    playerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    unitCount: {
        color: '#CCC',
        fontSize: 12,
        marginTop: 2,
    },
    bottomHUD: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderTopWidth: 2,
        borderTopColor: 'rgba(255, 215, 0, 0.3)',
    },
    gridToggleButton: {
        backgroundColor: '#1976D2',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#0D47A1',
    },
    gridToggleText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    unplacedUnitsContainer: {
        position: 'absolute',
        top: 120,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    unplacedUnitsTitle: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    unplacedUnitsScroll: {
        flexDirection: 'row',
    },
    unplacedUnit: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    unplacedUnitName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    unplacedUnitStats: {
        color: '#CCC',
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        maxWidth: 400,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    tooltipTitle: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    tooltipSection: {
        marginBottom: 15,
    },
    tooltipSectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tooltipItem: {
        color: '#CCC',
        fontSize: 14,
        marginBottom: 4,
        paddingLeft: 10,
    },
    upgradeGroup: {
        marginBottom: 8,
    },
    upgradeUnitType: {
        color: '#4CAF50',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    closeButton: {
        backgroundColor: '#1976D2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'center',
        marginTop: 10,
        borderWidth: 2,
        borderColor: '#0D47A1',
    },
    closeButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    upgradeAvailableButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 25,
        alignSelf: 'center',
        marginVertical: 10,
        borderWidth: 2,
        borderColor: '#2E7D32',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        // Add pulsing animation effect
        transform: [{ scale: 1 }],
    },
    upgradeAvailableText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    upgradeContainer: {
        flex: 1,
        position: 'relative',
    },
    compactUpgradeContainer: {
        position: 'relative',
        maxHeight: '85%', // Increased from 60% to 85%
        maxWidth: '95%', // Increased from 80% to 95%
        minWidth: '90%', // Added minimum width
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#FFD700',
        overflow: 'hidden',
    },
    closeUpgradeButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        zIndex: 1000,
    },
    closeUpgradeText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bottomRightUpgradeButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    bottomRightUpgradeButtonInner: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 10,
    },
    timerText: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 8,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    timerTextOrange: {
        color: '#FFA500',
    },
    timerTextRed: {
        color: '#FF4444',
    },
    fullscreenButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    fullscreenButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
exports.default = GameHUD;
