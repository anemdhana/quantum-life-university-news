@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Stopping any existing QLU CMS / Web windows and ports 3000 / 4321...
taskkill /FI "WINDOWTITLE eq QLU CMS*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq QLU Web*" /T /F >nul 2>&1
call :kill_port 3000
call :kill_port 4321

if not exist "apps\cms\.env" (
  if exist "apps\cms\.env.example" (
    echo Creating apps\cms\.env from .env.example...
    copy /Y "apps\cms\.env.example" "apps\cms\.env" >nul
  ) else if exist ".env.example" (
    echo Creating apps\cms\.env from root .env.example...
    copy /Y ".env.example" "apps\cms\.env" >nul
  )
)

if not exist "apps\web\.env" (
  if exist "apps\web\.env.example" (
    echo Creating apps\web\.env from .env.example...
    copy /Y "apps\web\.env.example" "apps\web\.env" >nul
  )
)

if not exist "node_modules\" (
  echo.
  echo Installing npm dependencies ^(first time^)...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting Postgres (Docker)...
docker compose up -d --wait
if errorlevel 1 (
  echo.
  echo Docker failed. Start Docker Desktop, then re-run this script.
  pause
  exit /b 1
)

if /I "%FORCE_SEED%"=="1" if exist ".qlu-seeded" del /F /Q ".qlu-seeded" >nul 2>&1

if not exist ".qlu-seeded" (
  echo.
  echo First-time seed: magazine + Jnanodayam into Payload...
  call npm run seed
  if errorlevel 1 (
    echo.
    echo Seed failed. Check apps\cms\.env DATABASE_URL ^(port 5433^) and Docker Postgres.
    echo You can retry later with:  npm run seed
    pause
    exit /b 1
  )
  echo. > ".qlu-seeded"
  echo Seed complete. ^(Marker: .qlu-seeded — delete it or set FORCE_SEED=1 to re-seed on next run.^)
) else (
  echo.
  echo Seed already done ^(.qlu-seeded^). Skip. To re-seed: del .qlu-seeded  or  set FORCE_SEED=1
)

echo.
echo Opening Payload CMS  (:3000) and Astro site (:4321) in new windows...
start "QLU CMS" cmd /k "cd /d "%~dp0" && npm run dev:cms"
start "QLU Web" cmd /k "cd /d "%~dp0" && npm run dev:web"

echo.
echo Waiting for servers, then opening browsers...
call :wait_port 3000 90
if errorlevel 1 (
  echo Timed out waiting for CMS on :3000 — open http://localhost:3000/admin yourself.
) else (
  start "" "http://localhost:3000/admin"
)
call :wait_port 4321 90
if errorlevel 1 (
  echo Timed out waiting for Astro on :4321 — open http://localhost:4321 yourself.
) else (
  start "" "http://localhost:4321"
)

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

:wait_port
set "PORT=%~1"
set "MAX=%~2"
if "%MAX%"=="" set "MAX=60"
set /a "N=0"
:wait_port_loop
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>&1
if not errorlevel 1 exit /b 0
set /a "N+=1"
if %N% GEQ %MAX% exit /b 1
timeout /t 1 /nobreak >nul
goto wait_port_loop
