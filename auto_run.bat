@echo off
rem GVAS - Auto Run Script
rem ====================================
rem This script automatically starts both backend and frontend servers

rem Start backend in a new window
start "Backend Server" cmd /k "cd /d %~dp0 && start_backend.bat"

rem Wait a moment for backend to start
ping -n 5 127.0.0.1 > nul

rem Start frontend in a new window
start "Frontend Server" cmd /k "cd /d %~dp0 && start_frontend.bat"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
pause
