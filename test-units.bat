@echo off
echo Testing unit selection with sprites...
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
echo TEST INSTRUCTIONS:
echo 1. Check browser console for logs
echo 2. Click the green "Show Unit Selection" button (top right)
echo 3. You should see 5 unit cards with sprites
echo 4. Click units to select them (up to 5)
echo 5. Selected units should highlight in gold
echo 6. Start Game button enables at 5 selections
echo.
echo If sprites don't load, check console for image errors
pause