@echo off
echo.
echo ========================================
echo   Starting PocketBase Local Server
echo ========================================
echo.
echo This will start PocketBase on http://127.0.0.1:8090
echo Admin UI: http://127.0.0.1:8090/_/
echo.
echo Press Ctrl+C to stop
echo.
echo ========================================
echo.

REM Change this path to where you put pocketbase.exe
cd /d "%~dp0"
if exist "pocketbase.exe" (
    pocketbase.exe serve
) else (
    echo ERROR: pocketbase.exe not found!
    echo.
    echo Please download PocketBase from:
    echo https://github.com/pocketbase/pocketbase/releases
    echo.
    echo Extract pocketbase.exe to this folder and run again.
    echo.
    pause
)

