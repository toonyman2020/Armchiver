@echo off
title Catti Cango - Windows Local Launcher
color 0B
cls

echo =======================================================================
echo          ____      _   _   _    ____                                
echo         / ___|__ _^| ^|_^| ^|_^| ^|  / ___| __ _ _ __   __ _  ___         
echo        ^| ^|   / _` ^| __^| __^| ^| ^| ^|   / _` ^| '_ \ / _` ^|/ _ \        
echo        ^| ^|___^| (_^| ^| ^|_^| ^|_^| ^| ^| ^|___^| (_^| ^| ^| ^| ^| (_^| ^| (_) ^|       
echo         \____\__,_^|\__^|\__^|_^|  \____\__,_^|_^| ^|_^|\__, ^|\___/        
echo                                                 ^|___/               
echo =======================================================================
echo           WINDOWS NATIVE DESKTOP OFFLINE & LOCAL LAUNCHER
echo =======================================================================
echo.

:: 1. Check for Node.js
echo [1/5] Checking system prerequisites...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js was not found on your Windows system.
    echo To run Catti Cango locally, please download and install Node.js:
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
    echo # Catti Cango Local Configuration > .env
    echo PORT=3000 >> .env
    echo NODE_ENV=production >> .env
    echo # Paste your Google Gemini API Key below to enable AI analysis locally >> .env
    echo GEMINI_API_KEY= >> .env
    echo.
    echo   ==============================================================
    echo   IMPORTANT: To use AI image/text analysis, please open the
    echo   newly created ".env" file in Notepad and paste your 
    echo   Google Gemini API Key inside: GEMINI_API_KEY=your_key_here
    echo   ==============================================================
    echo.
) else (
    echo -- Local .env configuration file detected.
)
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

:: 5. Open Browser and Launch Server
echo [5/5] Launching Catti Cango on Windows!
echo -- Your default web browser will open http://localhost:3000 in a few seconds...
echo.

:: Start browser after 2 seconds delay
start "" http://localhost:3000

:: Start Express server
call npm run start

pause
