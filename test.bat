@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Small World V1 - Test

if not exist "node_modules\vitest\vitest.mjs" (
  echo [INFO] Dependencies are not installed. Run install.bat first.
  pause
  exit /b 1
)

npm test
if errorlevel 1 (
  echo.
  echo [ERROR] Tests failed.
  pause
  exit /b 1
)

echo.
echo [OK] All automated tests passed.
pause
