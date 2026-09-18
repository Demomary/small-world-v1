@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Small World V1 - Start

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Run install.bat after installing Node.js 20 LTS or newer.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo [INFO] Dependencies are not installed. Running install.bat...
  call install.bat
  if errorlevel 1 exit /b 1
)

echo.
echo Starting Small World...
echo Browser: http://localhost:5173/
echo Close this window to stop the game server.
echo.

start "Small World Browser" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/"
npm run dev -- --host 127.0.0.1
