@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Small World V1 - Build

if not exist "node_modules\vite\bin\vite.js" (
  echo [INFO] Dependencies are not installed. Run install.bat first.
  pause
  exit /b 1
)

npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

echo.
echo [OK] Build completed. Output: dist\
pause
