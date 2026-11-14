@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  QLU News - Start CMS API + Astro site (no admin UI)
REM  Like dev-remote.cmd, but:
REM    - starts Payload on :3000 for REST (needed by Astro)
REM    - starts Astro on :4321
REM    - opens only the site in the browser (NOT /admin)
REM
REM  Requires repo-root .env with DATABASE_URL (remote Postgres).
REM
REM  Double-click, or from repo root:
REM    .\dev-web.cmd
REM ============================================================

cd /d "%~dp0"

set "CMS_URL=http://localhost:3000"
set "WEB_URL=http://localhost:4321"
set "DATABASE_URL="

echo.
echo  ========================================
echo   QLU News  (CMS API + Astro)
echo   Admin UI will NOT open
echo  ========================================
echo.

echo Stopping any existing QLU CMS / Web windows and ports 3000 / 4321...
taskkill /FI "WINDOWTITLE eq QLU CMS*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq QLU Web*" /T /F >nul 2>&1
call :kill_port 3000
call :kill_port 4321

if not exist "apps\cms" (
  echo [ERROR] apps\cms folder not found.
  pause
  exit /b 1
)

if not exist "apps\web" (
  echo [ERROR] apps\web folder not found.
  pause
  exit /b 1
)

if not exist ".env" (
  echo [ERROR] .env not found in repo root.
  echo         Copy .env.example to .env and set DATABASE_URL to your remote Postgres URI.
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

REM --- Load DATABASE_URL (and optional secrets) from root .env ---
echo [1/3] Loading remote DATABASE_URL from .env ...
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
  if /I "%%A"=="DATABASE_URL" set "DATABASE_URL=%%B"
  if /I "%%A"=="PAYLOAD_SECRET" set "PAYLOAD_SECRET=%%B"
  if /I "%%A"=="PAYLOAD_PUBLIC_SERVER_URL" set "PAYLOAD_PUBLIC_SERVER_URL=%%B"
  if /I "%%A"=="PUBLIC_WEB_URL" set "PUBLIC_WEB_URL=%%B"
  if /I "%%A"=="PUBLIC_PAYLOAD_URL" set "PUBLIC_PAYLOAD_URL=%%B"
)

REM Trim surrounding quotes if present
if defined DATABASE_URL (
  if "!DATABASE_URL:~0,1!"=="""" set "DATABASE_URL=!DATABASE_URL:~1!"
  if "!DATABASE_URL:~-1!"=="""" set "DATABASE_URL=!DATABASE_URL:~0,-1!"
)
if defined PUBLIC_WEB_URL (
  if "!PUBLIC_WEB_URL:~0,1!"=="""" set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL:~1!"
  if "!PUBLIC_WEB_URL:~-1!"=="""" set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL:~0,-1!"
  set "WEB_URL=!PUBLIC_WEB_URL!"
)
if defined PUBLIC_PAYLOAD_URL (
  if "!PUBLIC_PAYLOAD_URL:~0,1!"=="""" set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL:~1!"
  if "!PUBLIC_PAYLOAD_URL:~-1!"=="""" set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL:~0,-1!"
  set "CMS_URL=!PUBLIC_PAYLOAD_URL!"
)

if not defined DATABASE_URL (
  echo [ERROR] DATABASE_URL missing in root .env
  echo         Example: DATABASE_URL=postgres://user:pass@host/db?sslmode=require
  pause
  exit /b 1
)

echo !DATABASE_URL! | findstr /I /C:"127.0.0.1:5433" /C:"localhost:5433" >nul
if not errorlevel 1 (
  echo [WARN] DATABASE_URL looks like local Docker Postgres ^(5433^).
  echo        For remote DB use Neon/Supabase/etc. URI. Continuing anyway...
) else (
  echo       Remote DATABASE_URL loaded.
)

if not defined PAYLOAD_SECRET set "PAYLOAD_SECRET=change-me-to-a-long-random-string"
if not defined PAYLOAD_PUBLIC_SERVER_URL set "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000"
if not defined PUBLIC_WEB_URL set "PUBLIC_WEB_URL=http://localhost:4321"
if not defined PUBLIC_PAYLOAD_URL set "PUBLIC_PAYLOAD_URL=http://localhost:3000"

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

echo [2/3] Skipping local Docker Postgres  ^(using remote DATABASE_URL^).

REM Export for child windows
set "DATABASE_URL=!DATABASE_URL!"
set "PAYLOAD_SECRET=!PAYLOAD_SECRET!"
set "PAYLOAD_PUBLIC_SERVER_URL=!PAYLOAD_PUBLIC_SERVER_URL!"
set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL!"
set "PUBLIC_PAYLOAD_URL=!PUBLIC_PAYLOAD_URL!"
set "NODE_TLS_REJECT_UNAUTHORIZED=0"

echo [3/3] Starting CMS API (:3000) + Astro (:4321)...
echo       Browser will open the site only — not /admin.
start "QLU CMS (remote)" cmd /k "cd /d ""%~dp0"" && echo CMS API against remote Postgres ^(no admin UI opened^)... && echo DATABASE_URL is set from root .env && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run dev:cms"
start "QLU Web" cmd /k "cd /d ""%~dp0"" && npm run dev:web"

echo.
echo Waiting for CMS API, then Astro...
call :wait_port 3000 90
if errorlevel 1 (
  echo Timed out waiting for CMS on :3000 — Astro REST calls may fail until CMS is up.
) else (
  echo       CMS API ready on :3000
)
call :wait_port 4321 90
if errorlevel 1 (
  echo Timed out waiting for Astro on :4321 — open %WEB_URL% yourself.
) else (
  start "" "%WEB_URL%"
)

echo.
echo  Postgres : remote  (DATABASE_URL from root .env)
echo  CMS API  : %CMS_URL%   ^(running; admin UI not opened^)
echo  Site     : %WEB_URL%
echo.
echo  Close the "QLU CMS" and "QLU Web" windows to stop the servers.
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
