@echo off
rem GVAS - Backend Server Start Script
rem ================================================

echo Starting GVAS Backend Server...
echo.

rem Check if we're in the correct directory
cd /d "%~dp0"

rem Navigate to backend directory
cd backend

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server on http://localhost:8000...
echo Press Ctrl+C to stop the server
echo.

rem Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

echo Backend server stopped.
pause
