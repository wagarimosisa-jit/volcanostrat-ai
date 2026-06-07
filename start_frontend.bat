@echo off
rem VolcanoStrat AI - Frontend Server Start Script
rem =================================================

echo Starting VolcanoStrat AI Frontend Server...
echo.

rem Check if we're in the correct directory
cd /d "%~dp0"

rem Navigate to frontend directory
cd frontend

echo Installing/updating npm dependencies...
npm install

echo.
echo Starting React development server on http://localhost:3000...
echo Press Ctrl+C to stop the server
echo.

rem Start the React development server
npm start

echo Frontend server stopped.
pause
