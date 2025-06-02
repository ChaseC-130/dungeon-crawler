@echo off
echo Testing updated game...
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
echo Game should now show:
echo 1. Unit selection modal on first load
echo 2. Responsive grid that scales with window
echo 3. Shop with draggable unit cards
echo.
echo Check browser console for debug logs!
pause