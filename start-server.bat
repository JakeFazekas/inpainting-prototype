@echo off
REM Double-click this file to start the MaskForge prototype server.
REM Then open http://localhost:3000 in your browser.
cd /d "%~dp0"
echo.
echo   Starting MaskForge server...
echo   Leave this window open while you use it.
echo   Open http://localhost:3000 in your browser.
echo   Press Ctrl+C (or close this window) to stop.
echo.
node server.js
echo.
echo   Server stopped.
pause
