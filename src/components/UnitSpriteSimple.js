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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
// Calculate grid cell size to match main game
var calculateGridCellSize = function () {
    var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
    var gridWidth = 20;
    var gridHeight = 8;
    return Math.min((width * 0.9) / gridWidth, (height * 0.7) / gridHeight);
};
function getUnitColor(unitName) {
    var colors = {
        knight: '#4CAF50',
        priest: '#2196F3',
        fighter: '#FF5722',
        wizard: '#9C27B0',
        goblin: '#8BC34A',
        gladiator: '#FFC107',
        assassin: '#795548',
        bishop: '#00BCD4',
        blacksmith: '#607D8B',
        druidess: '#4CAF50',
        vampire: '#9C27B0',
        werewolf: '#795548',
        'red dragon': '#FF0000',
    };
    return colors[unitName.toLowerCase()] || '#666666';
}
var UnitSpriteSimple = react_1.default.memo(function (_a) {
    var unitName = _a.unitName, width = _a.width, height = _a.height, _b = _a.useGridCellSize, useGridCellSize = _b === void 0 ? false : _b;
    var _c = (0, react_1.useState)(null), spriteDataUrl = _c[0], setSpriteDataUrl = _c[1];
    var canvasRef = (0, react_1.useRef)(null);
    var _d = (0, react_1.useState)(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = (0, react_1.useState)(false), error = _e[0], setError = _e[1];
    var animationRef = (0, react_1.useRef)(null);
    var idleFramesRef = (0, react_1.useRef)([]);
    var currentFrameRef = (0, react_1.useRef)(0);
    // Use grid cell size if requested, otherwise use provided dimensions
    var finalWidth = useGridCellSize ? calculateGridCellSize() : width;
    var finalHeight = useGridCellSize ? calculateGridCellSize() : height;
    (0, react_1.useEffect)(function () {
        var loadSprite = function () { return __awaiter(void 0, void 0, void 0, function () {
            var unitPath, fileName, imgUrl_1, jsonUrl, _a, imgResponse, jsonResponse, jsonData_1, imgBlob, imgUrl, img_1, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        unitPath = unitName.toLowerCase();
                        fileName = unitPath === 'red dragon' ? 'reddragon' : unitPath;
                        imgUrl_1 = "/assets/units/".concat(unitPath, "/").concat(fileName, ".png");
                        jsonUrl = "/assets/units/".concat(unitPath, "/").concat(fileName, ".json");
                        console.log("Loading sprite for ".concat(unitName, ": img=").concat(imgUrl_1, ", json=").concat(jsonUrl));
                        return [4 /*yield*/, Promise.all([
                                fetch(imgUrl_1),
                                fetch(jsonUrl)
                            ])];
                    case 1:
                        _a = _b.sent(), imgResponse = _a[0], jsonResponse = _a[1];
                        if (!imgResponse.ok || !jsonResponse.ok) {
                            console.error("Failed to load sprite assets for: ".concat(unitName));
                            console.error("Image response: ".concat(imgResponse.status, " ").concat(imgResponse.statusText));
                            console.error("JSON response: ".concat(jsonResponse.status, " ").concat(jsonResponse.statusText));
                            setError(true);
                            setIsLoading(false);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, jsonResponse.json()];
                    case 2:
                        jsonData_1 = _b.sent();
                        return [4 /*yield*/, imgResponse.blob()];
                    case 3:
                        imgBlob = _b.sent();
                        imgUrl_1 = URL.createObjectURL(imgBlob);
                        img_1 = new react_native_1.Image();
                        img_1.onload = function () {
                            if (!canvasRef.current)
                                return;
                            var ctx = canvasRef.current.getContext('2d');
                            if (!ctx)
                                return;
                            // Clear canvas
                            ctx.clearRect(0, 0, finalWidth, finalHeight);
                            // Find idle frames (TexturePacker or Phaser atlas formats)
                            var frameData = null;
                            var idleFrames = [];
                            // Complex frame sorting function matching main game exactly
                            var extractFrameInfo = function (frameName) {
                                // Matches: (Action)_ (MainFrameNumber) _ (SubFrameNumber) (AnythingElse) .png
                                // Or:      (Action)_ (MainFrameNumber) (AnythingElse) .png
                                var match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
                                if (match) {
                                    var mainFrame = parseInt(match[2], 10);
                                    var subFrame = match[3] ? parseInt(match[3], 10) : 0;
                                    return { mainFrame: mainFrame, subFrame: subFrame };
                                }
                                // Fallback: try to find any number if the pattern is different
                                var fallbackMatch = frameName.match(/(\d+)/);
                                if (fallbackMatch) {
                                    return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
                                }
                                return { mainFrame: Infinity, subFrame: Infinity };
                            };
                            var sortFrames = function (frameA, frameB, getNameFn) {
                                var infoA = extractFrameInfo(getNameFn(frameA));
                                var infoB = extractFrameInfo(getNameFn(frameB));
                                if (infoA.mainFrame === infoB.mainFrame) {
                                    return infoA.subFrame - infoB.subFrame;
                                }
                                return infoA.mainFrame - infoB.mainFrame;
                            };
                            if (jsonData_1.textures && jsonData_1.textures[0] && jsonData_1.textures[0].frames) {
                                // TexturePacker format
                                var frames_1 = jsonData_1.textures[0].frames;
                                idleFrames = frames_1.filter(function (f) { return f.filename.toLowerCase().includes('idle'); });
                                if (idleFrames.length > 0) {
                                    // Sort idle frames using exact same complex sorting as main game
                                    idleFrames.sort(function (a, b) { return sortFrames(a, b, function (f) { return f.filename; }); });
                                }
                                else {
                                    // Use all frames as fallback, limit to 4 like main game
                                    idleFrames = frames_1.slice(0, Math.min(4, frames_1.length));
                                }
                                frameData = idleFrames[0];
                            }
                            else if (jsonData_1.frames) {
                                // Phaser atlas format
                                var frames_2 = Object.entries(jsonData_1.frames);
                                var idlePairs = frames_2.filter(function (_a) {
                                    var key = _a[0];
                                    return key.toLowerCase().includes('idle');
                                });
                                if (idlePairs.length > 0) {
                                    // Sort idle frames using exact same complex sorting as main game
                                    idlePairs.sort(function (_a, _b) {
                                        var keyA = _a[0];
                                        var keyB = _b[0];
                                        var infoA = extractFrameInfo(keyA);
                                        var infoB = extractFrameInfo(keyB);
                                        if (infoA.mainFrame === infoB.mainFrame) {
                                            return infoA.subFrame - infoB.subFrame;
                                        }
                                        return infoA.mainFrame - infoB.mainFrame;
                                    });
                                    idleFrames = idlePairs.map(function (_a) {
                                        var val = _a[1];
                                        return val;
                                    });
                                }
                                else {
                                    // Use all frames as fallback, limit to 4 like main game
                                    var allFrames = Object.values(jsonData_1.frames);
                                    idleFrames = allFrames.slice(0, Math.min(4, allFrames.length));
                                }
                                frameData = idleFrames[0];
                            }
                            idleFramesRef.current = idleFrames;
                            var renderFrame = function (frame) {
                                var _a, _b;
                                var frameWidth = frame.frame.w;
                                var frameHeight = frame.frame.h;
                                // Use exact same scaling as main game grid (0.8 scale factor)
                                var scale = 0.8;
                                var destWidth = frameWidth * scale;
                                var destHeight = frameHeight * scale;
                                // Position sprite like main game (accounting for sprite source positioning)
                                var destX = (finalWidth - destWidth) / 2 - (((_a = frame.spriteSourceSize) === null || _a === void 0 ? void 0 : _a.x) || 0) * scale;
                                var destY = (finalHeight - destHeight) / 2 - (((_b = frame.spriteSourceSize) === null || _b === void 0 ? void 0 : _b.y) || 0) * scale;
                                ctx.clearRect(0, 0, finalWidth, finalHeight);
                                ctx.imageSmoothingEnabled = false;
                                ctx.drawImage(img_1, frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h, destX, destY, destWidth, destHeight);
                                setSpriteDataUrl(canvasRef.current.toDataURL());
                            };
                            if (frameData && frameData.frame) {
                                renderFrame(frameData);
                                setIsLoading(false);
                                if (idleFrames.length > 1) {
                                    var animate_1 = function () {
                                        currentFrameRef.current = (currentFrameRef.current + 1) % idleFramesRef.current.length;
                                        var frame = idleFramesRef.current[currentFrameRef.current];
                                        renderFrame(frame);
                                        animationRef.current = requestAnimationFrame(function () {
                                            // Match frame rate 10 from main game: 1000ms / 10 = 100ms per frame
                                            setTimeout(animate_1, 100);
                                        });
                                    };
                                    animationRef.current = requestAnimationFrame(function () {
                                        // Match frame rate 10 from main game: 1000ms / 10 = 100ms per frame
                                        setTimeout(animate_1, 100);
                                    });
                                }
                                console.log("Successfully loaded sprite for ".concat(unitName, ": ").concat(frameData.filename || frameData.name || 'unknown frame'));
                            }
                            else {
                                // Fallback: draw the entire image with exact same scaling as main game
                                var scale = 0.8;
                                var destWidth = img_1.width * scale;
                                var destHeight = img_1.height * scale;
                                var destX = (finalWidth - destWidth) / 2;
                                var destY = (finalHeight - destHeight) / 2;
                                ctx.imageSmoothingEnabled = false;
                                ctx.drawImage(img_1, destX, destY, destWidth, destHeight);
                                setSpriteDataUrl(canvasRef.current.toDataURL());
                                setIsLoading(false);
                                console.log("Used fallback rendering for ".concat(unitName));
                            }
                            // Clean up
                            URL.revokeObjectURL(imgUrl_1);
                        };
                        img_1.onerror = function () {
                            console.error('Failed to load sprite image:', unitName);
                            URL.revokeObjectURL(imgUrl_1);
                            setError(true);
                            setIsLoading(false);
                        };
                        img_1.src = imgUrl_1;
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.error('Error loading sprite:', error_1);
                        setError(true);
                        setIsLoading(false);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        loadSprite();
        return function () {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [unitName, finalWidth, finalHeight]);
    if (react_native_1.Platform.OS === 'web') {
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.container, { width: finalWidth, height: finalHeight }], children: [(0, jsx_runtime_1.jsx)("canvas", { ref: canvasRef, width: finalWidth, height: finalHeight, style: { display: 'none' } }), isLoading && !error && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.placeholder, { width: finalWidth, height: finalHeight }], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.loadingBox }) })), error && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.placeholder, { width: finalWidth, height: finalHeight }], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.errorBox, { backgroundColor: getUnitColor(unitName) }] }) })), spriteDataUrl && !error && ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: spriteDataUrl }, style: [styles.sprite, { width: finalWidth, height: finalHeight }], resizeMode: "contain" }))] }));
    }
    // Fallback for non-web platforms
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.container, { width: finalWidth, height: finalHeight }], children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: "/assets/units/".concat(unitName.toLowerCase(), "/").concat(unitName.toLowerCase(), ".png") }, style: [styles.sprite, { width: finalWidth * 0.8, height: finalHeight * 0.8 }], resizeMode: "contain" }) }));
});
var styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sprite: {
        imageRendering: 'pixelated',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingBox: {
        width: '60%',
        height: '60%',
        backgroundColor: '#ccc',
        borderRadius: 8,
    },
    errorBox: {
        width: '60%',
        height: '60%',
        borderRadius: 8,
        opacity: 0.7,
    },
});
exports.default = UnitSpriteSimple;
