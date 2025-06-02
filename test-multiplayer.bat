@echo off
echo Testing multiplayer system with proper unit selection...
echo.

REM Kill any existing processes
taskkill /f /im node.exe 2>nul

timeout /t 2 /nobreak > nul

echo Starting game server...
start "Game Server" cmd /k "npm run server"

timeout /t 3 /nobreak > nul

echo Starting web server...
start "Web Server" cmd /k "npm run web"

timeout /t 3 /nobreak > nul

echo Opening browser...
start http://localhost:8080

echo.
echo TESTING FLOW:
echo 1. See lobby screen with "Find Match" and "Create Private Match" buttons
echo 2. Click "Find Match" to search for other players (1-4 players)
echo 3. Once match found, select 5 starting units
echo 4. Units should show with proper sprites (not spritesheets)
echo 5. After "Start Game", shop should show your 5 selected units
echo 6. Drag units from shop to grid to place them
echo.
echo Open multiple browser tabs to test multiplayer!
pause