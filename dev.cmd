@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Stopping any existing QLU CMS / Web windows and ports 3000 / 4321...
taskkill /FI "WINDOWTITLE eq QLU CMS*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq QLU Web*" /T /F >nul 2>&1
call :kill_port 3000
call :kill_port 4321

echo.
echo Starting Postgres (Docker)...
docker compose up -d
if errorlevel 1 (
  echo.
  echo Docker failed. Start Docker Desktop, then re-run this script.
  pause
  exit /b 1
)

echo.
echo Opening Payload CMS  (:3000) and Astro site (:4321) in new windows...
start "QLU CMS" cmd /k "cd /d "%~dp0" && npm run dev:cms"
start "QLU Web" cmd /k "cd /d "%~dp0" && npm run dev:web"

echo.
echo CMS admin:  http://localhost:3000/admin
echo Public site: http://localhost:4321
echo.
echo Re-run this script to stop and restart. Or close the two windows to stop.
endlocal
exit /b 0

:kill_port
set "PORT=%~1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  if not "%%P"=="0" (
    echo   Killing PID %%P on port %PORT%
    taskkill /PID %%P /T /F >nul 2>&1
  )
)
exit /b 0
