@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Small World V1 - Install

echo ========================================
echo   Small World V1 - Installation
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [INFO] Node.js was not found.
  where winget >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] winget is not available.
    echo Please install Node.js 20 LTS or newer from https://nodejs.org/
    echo then run install.bat again.
    pause
    exit /b 1
  )
  echo [INFO] Trying to install Node.js LTS with Windows Package Manager...
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo [ERROR] Automatic Node.js installation failed.
    echo Please install Node.js 20 LTS or newer manually, then run install.bat again.
    pause
    exit /b 1
  )
  echo.
  echo [INFO] Node.js was installed. Please close this window and double-click install.bat again.
  pause
  exit /b 0
)

for /f "tokens=1" %%v in ('node -p "process.versions.node"') do set NODE_VERSION=%%v
echo [INFO] Node.js: %NODE_VERSION%

node -e "const [m]=process.versions.node.split('.').map(Number); if(m<20) process.exit(1)"
if errorlevel 1 (
  echo [ERROR] Node.js 20 or newer is required. Current: %NODE_VERSION%
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Please reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

echo.
echo [1/3] Installing dependencies...
npm install --no-audit --no-fund --fetch-retries=5 --fetch-timeout=120000
if errorlevel 1 goto :fail

echo.
echo [2/3] Building the project...
npm run build
if errorlevel 1 goto :fail

echo.
echo [3/3] Running automated tests...
npm test
if errorlevel 1 goto :fail

echo.
echo ========================================
echo   Installation completed successfully.
echo ========================================
echo.
echo Double-click start.bat to launch Small World.
echo.
pause
exit /b 0

:fail
echo.
echo ========================================
echo   Installation failed.
echo ========================================
echo Check the error message above.
echo.
pause
exit /b 1
