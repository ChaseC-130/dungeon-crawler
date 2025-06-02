# Complete Game Flow Test

## Expected Flow According to Game Requirements

### 1. **Lobby Phase** (NEW - Multiplayer Support)
- Players see lobby screen
- Can join public match (1-4 players) or create private match
- See other players in lobby
- All players must ready up to proceed

### 2. **Unit Selection Phase** (Per Requirements)
- Players select 5 starting units from available pool
- No pre-selected heroes (as specified)
- Units available: knight, priest, fighter, wizard, goblin

### 3. **Preparation Phase - Floor 1** (Per Requirements) 
- All players start with 50 gold
- Shop shows only the 5 units you selected (not random units)
- Purchase units from your selected pool
- Place units on shared 12x12 grid
- Can sell units for 75% refund
- Reroll shop costs 10 gold (for shop units, not upgrades)
- Ready button to proceed to combat

### 4. **Combat Phase** (Auto-battle per Requirements)
- Units auto-path toward enemy side
- Auto-attacks when enemies in range
- Combat resolves until one side eliminated
- If all player units die → game over
- Surviving units persist to next floor

### 5. **Post-Combat Phase** (Per Requirements)
- Only after combat completion
- 4 random upgrade cards (1 high-potency, 3 normal)
- High-potency: auto-assigned to random unit type
- Normal: player chooses unit type to apply
- Reroll upgrade cards costs 10 gold each
- Proceed to next floor

### 6. **Floor Progression** (Per Requirements)
- Floors 1-10 
- AI spawn budget = (Floor × 25) + (Player Units Cost × 0.60)
- Floor scaling increases difficulty
- Win condition: Clear all 10 floors

## Current Implementation Status

✅ **Lobby System** - Multi-player support (1-4 players)
✅ **Unit Selection** - 5 starting units, no pre-heroes
✅ **Starting Gold** - 50 gold per player
✅ **Shop System** - Shows selected units only
✅ **Reroll Mechanics** - 10 gold for shop, 10 gold for upgrades
✅ **Grid System** - 12x12 shared grid
✅ **Responsive Design** - Scales with window

🔧 **Still Need**:
- Combat auto-battle implementation
- AI enemy spawning system
- Upgrade card system after combat
- Floor progression (1-10)
- Win/lose conditions

## Test Instructions

1. Run `test-full-flow.bat`
2. Open http://localhost:8080
3. Follow the complete flow above
4. Check server logs for event handling
5. Test with multiple browser tabs for multiplayer