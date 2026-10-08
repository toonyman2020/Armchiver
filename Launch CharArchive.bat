@echo off
title CharArchive
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
echo            LAUNCHER
echo =======================================================================
echo.

:: Launch the packaged app. It bundles its own Node runtime, so this works
:: whether or not Node is installed, and needs no build step.
set "APP=%~dp0..\CharArchive\CharArchive.exe"

if not exist "%APP%" (
    color 0C
    echo ERROR: The CharArchive app was not found.
    echo.
    echo Looked for:
    echo   %APP%
    echo.
    echo It should be at Z:\Armchiver\CharArchive\CharArchive.exe
    echo.
    pause
    exit /b 1
)

echo -- Starting CharArchive...
echo -- The app window will open. This window can be closed.
echo.

start "" "%APP%"

exit /b 0