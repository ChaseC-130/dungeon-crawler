@echo off
echo Restarting game servers...
echo.

REM Kill any existing node processes (Windows)
taskkill /f /im node.exe 2>nul

echo Waiting for processes to close...
timeout /t 2 /nobreak > nul

echo Starting game server...
start "Game Server" cmd /k "npm run server"

timeout /t 2 /nobreak > nul

echo Starting web server...
start "Web Server" cmd /k "npm run web"

timeout /t 2 /nobreak > nul

echo Opening browser...
start http://localhost:8080

echo.
echo Game restarted! Check http://localhost:8080
pause