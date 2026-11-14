@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  QLU News - Start Astro only (no CMS / admin)
REM  Clone of dev-remote.cmd, but only opens the site on :4321.
REM  Expects CMS already running (local or remote) at PUBLIC_PAYLOAD_URL.
REM
REM  Double-click, or from repo root:
REM    .\dev-web.cmd
REM ============================================================

cd /d "%~dp0"

set "WEB_URL=http://localhost:4321"
set "PUBLIC_PAYLOAD_URL="

echo.
echo  ========================================
echo   QLU News  (Astro only)
echo   Starting site on :4321 ...
echo  ========================================
echo.

echo Stopping any existing QLU Web windows and port 4321...
taskkill /FI "WINDOWTITLE eq QLU Web*" /T /F >nul 2>&1
call :kill_port 4321

if not exist "apps\web" (
  echo [ERROR] apps\web folder not found.
  pause
  exit /b 1
)

REM --- Ensure apps/web/.env exists for PUBLIC_PAYLOAD_URL ---
if not exist "apps\web\.env" (
  if exist "apps\web\.env.example" (
    echo Creating apps\web\.env from .env.example...
    copy /Y "apps\web\.env.example" "apps\web\.env" >nul
  )
)

REM --- Optional: load PUBLIC_* from root .env ---
if exist ".env" (
  echo [1/2] Loading PUBLIC_PAYLOAD_URL / PUBLIC_WEB_URL from root .env ...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if /I "%%A"=="PUBLIC_PAYLOAD_URL" set "PUBLIC_PAYLOAD_URL=%%B"
    if /I "%%A"=="PUBLIC_WEB_URL" set "PUBLIC_WEB_URL=%%B"
  )
  if defined PUBLIC_PAYLOAD_URL (
    if "!PUBLIC_PAYLOAD_URL:~0,1!"=="""" set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL:~1!"
    if "!PUBLIC_PAYLOAD_URL:~-1!"=="""" set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL:~0,-1!"
  )
  if defined PUBLIC_WEB_URL (
    if "!PUBLIC_WEB_URL:~0,1!"=="""" set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL:~1!"
    if "!PUBLIC_WEB_URL:~-1!"=="""" set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL:~0,-1!"
    set "WEB_URL=!PUBLIC_WEB_URL!"
  )
) else (
  echo [1/2] No root .env — using apps\web\.env defaults.
)

if not defined PUBLIC_PAYLOAD_URL set "PUBLIC_PAYLOAD_URL=http://localhost:3000"
if not defined PUBLIC_WEB_URL set "PUBLIC_WEB_URL=http://localhost:4321"
if not defined WEB_URL set "WEB_URL=http://localhost:4321"

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

set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL!"
set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL!"

echo [2/2] Opening Astro site (:4321)...
echo       CMS is not started by this script — pointing at !PUBLIC_PAYLOAD_URL!
start "QLU Web" cmd /k "cd /d ""%~dp0"" && npm run dev:web"

echo.
echo Waiting for Astro, then opening browser...
call :wait_port 4321 90
if errorlevel 1 (
  echo Timed out waiting for Astro on :4321 — open %WEB_URL% yourself.
) else (
  start "" "%WEB_URL%"
)

echo.
echo  CMS API  : !PUBLIC_PAYLOAD_URL!  ^(must already be running^)
echo  Site     : %WEB_URL%
echo.
echo  Close the "QLU Web" window to stop Astro.
echo.
pause
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
