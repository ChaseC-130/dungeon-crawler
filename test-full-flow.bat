@echo off
echo Testing COMPLETE end-to-end game flow...
echo.

REM Kill any existing processes
taskkill /f /im node.exe 2>nul

timeout /t 2 /nobreak > nul

echo Starting game server...
start "Game Server" cmd /k "npm run server"

timeout /t 4 /nobreak > nul

echo Starting web server...
start "Web Server" cmd /k "npm run web"

timeout /t 3 /nobreak > nul

echo Opening browser...
start http://localhost:8080

echo.
echo COMPLETE TESTING FLOW:
echo.
echo 1. LOBBY PHASE:
echo    - See lobby screen with Find Match / Create Private Match buttons
echo    - Click "Find Match" (should see server log: "Player looking for match")
echo    - See player list with your name
echo    - Click "Ready" button
echo    - Should automatically proceed to unit selection
echo.
echo 2. UNIT SELECTION PHASE:
echo    - See 5 unit cards: knight, priest, fighter, wizard, goblin
echo    - Units should show sprites (not spritesheets)
echo    - Click 5 units to select them (they highlight in gold)
echo    - Click "Start Game" button
echo.
echo 3. PREPARATION PHASE:
echo    - Shop should show your 5 selected units
echo    - Each unit should be draggable
echo    - You should have 50 gold
echo    - Drag units from shop to grid to place them
echo.
echo Check server console for all the logs!
echo Open multiple browser tabs to test multiplayer (up to 4 players)
echo.
pause