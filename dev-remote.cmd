@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  QLU News - Start CMS + Astro against a REMOTE Postgres
REM  Same launcher UX as dev.cmd, but does NOT start Docker
REM  Postgres (Neon / Supabase / Railway / etc.).
REM
REM  Requires repo-root .env with:
REM    DATABASE_URL=postgres://...  (remote; usually ?sslmode=require)
REM
REM  Double-click, or from repo root:
REM    .\dev-remote.cmd
REM ============================================================

cd /d "%~dp0"

set "CMS_URL=http://localhost:3000"
set "WEB_URL=http://localhost:4321"
set "DATABASE_URL="

echo.
echo  ========================================
echo   QLU News  (remote Postgres)
echo   Starting CMS + Astro...
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
)

REM Trim surrounding quotes if present
if defined DATABASE_URL (
  if "!DATABASE_URL:~0,1!"=="""" set "DATABASE_URL=!DATABASE_URL:~1!"
  if "!DATABASE_URL:~-1!"=="""" set "DATABASE_URL=!DATABASE_URL:~0,-1!"
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

REM Skip local Docker Postgres — data lives on remote.
echo [2/3] Skipping local Docker Postgres  ^(using remote DATABASE_URL^).
echo       No automatic seed against remote from this launcher.
echo       To seed remote intentionally: set DATABASE_URL then  npm run seed
echo.

REM Export for child windows (overrides apps\cms\.env local URL when set in process env)
set "DATABASE_URL=!DATABASE_URL!"
set "PAYLOAD_SECRET=!PAYLOAD_SECRET!"
set "PAYLOAD_PUBLIC_SERVER_URL=!PAYLOAD_PUBLIC_SERVER_URL!"
set "PUBLIC_WEB_URL=!PUBLIC_WEB_URL!"
REM Avoid Node pg treating sslmode=require as verify-full against Supabase pooler
set "NODE_TLS_REJECT_UNAUTHORIZED=0"

echo [3/3] Opening Payload CMS  (:3000) and Astro site (:4321)...
start "QLU CMS (remote)" cmd /k "cd /d ""%~dp0"" && echo CMS against remote Postgres... && echo DATABASE_URL is set from root .env && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run dev:cms"
start "QLU Web (remote)" cmd /k "cd /d ""%~dp0"" && npm run dev:web"

echo.
echo Waiting for servers, then opening browsers...
call :wait_port 3000 90
if errorlevel 1 (
  echo Timed out waiting for CMS on :3000 — open %CMS_URL%/admin yourself.
) else (
  start "" "%CMS_URL%/admin"
)
call :wait_port 4321 90
if errorlevel 1 (
  echo Timed out waiting for Astro on :4321 — open %WEB_URL% yourself.
) else (
  start "" "%WEB_URL%"
)

echo.
echo  Postgres : remote  (DATABASE_URL from root .env)
echo  CMS      : %CMS_URL%/admin
echo  Site     : %WEB_URL%
echo.
echo  Tip: keep local Docker URL in apps\cms\.env for .\dev.cmd
echo       and put the remote URI in root .env for .\dev-remote.cmd
echo  Two new windows were opened. Close those windows to stop the servers.
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
