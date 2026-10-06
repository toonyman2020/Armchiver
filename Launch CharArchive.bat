@echo off
title CharArchive - Windows Launcher
color 0B
cls

echo =======================================================================
echo   ___ _                _     _                            _
echo  / __| |__ _ _ __ _  | |__ | |_     __ _ _ __ __ _  ___| |_
echo  \__ \ '_ \ '_ \ '_ \| '_ \|  _|   / _` | '__/ _` |/ _ \ __|
echo  |___/| | | | | | | | |_) | | | | | (_| | | | (_| |  __/ |_
echo       |_| |_| |_| |_| |_.__/|_| |_|  \__,_|_|  \__, |\___|\__|
echo                                                 |___/
echo =======================================================================
echo            WINDOWS DESKTOP LAUNCHER
echo =======================================================================
echo.

:: 1. Check for Node.js
echo [1/5] Checking system prerequisites...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js was not found on your Windows system.
    echo To run CharArchive locally, please download and install Node.js:
    echo --^> https://nodejs.org/ (LTS version recommended)
    echo.
    echo After installing, please restart this launcher.
    pause
    exit /b
)
echo -- Node.js is installed!
node --version
echo.

:: 2. Create local .env if it does not exist
echo [2/5] Checking configuration files...
if not exist .env (
    echo -- Creating a local .env configuration file...
    echo # CharArchive local configuration > .env
    echo PORT=3000 >> .env
    echo NODE_ENV=production >> .env
    echo HOST=127.0.0.1 >> .env
    echo.
) else (
    echo -- Local .env configuration file detected.
)
echo -- The AI key is no longer set here: open the app, go to Menu, then the
echo    developer panel (PIN 000) and use AI Engine Settings.
echo.

:: 3. Install NPM dependencies
echo [3/5] Installing local packages (this may take a minute on first run)...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Package installation failed. Please check your internet connection.
    pause
    exit /b
)
echo -- Local packages installed successfully!
echo.

:: 4. Build the production bundle
echo [4/5] Building the local production bundle...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Build failed.
    pause
    exit /b
)
echo -- Production build completed successfully!
echo.

:: 5. Launch the desktop app
echo [5/5] Launching CharArchive...
echo -- A desktop window will open. No browser needed.
echo.

call npm run electron:start

pause
