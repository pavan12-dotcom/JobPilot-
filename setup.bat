@echo off
title JobPilot Setup Wizard
color 0A
echo.
echo  ===============================================================
echo   JobPilot -- Installation Wizard (Windows)
echo  ===============================================================
echo.

REM Check Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please download and install Node.js 18+ from:
    echo  https://nodejs.org/en/download/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected.
echo.
echo  Starting interactive setup wizard...
echo.

node "%~dp0setup.js"

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Setup failed. Check the messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo  Setup complete! Run:  npm run dev
echo.
pause
