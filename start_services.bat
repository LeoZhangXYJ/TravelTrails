@echo off
REM Batch script to start TravelTrails services

REM Get the directory of the batch file
SET SCRIPT_DIR=%~dp0

REM Set project base path relative to the script's location
SET PROJECT_BASE_PATH=%SCRIPT_DIR%

echo Starting services...

REM Start Backend Service (FastAPI - includes User Management and AI Recommendation)
echo Starting Backend Service...
cd /d "%PROJECT_BASE_PATH%"
REM Ensure you have uvicorn and other dependencies installed, e.g., from backend/requirements.txt
REM Frontend is expecting backend on port 8000.
start "BackendAPI" cmd /k "uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0"

REM Start Frontend (React)
echo Starting Frontend Development Server...
cd /d "%PROJECT_BASE_PATH%frontend"
start "FrontendDevServer" cmd /k "npm start"

echo All services are attempting to start in new command prompt windows.
REM Prevent the main batch file window from closing immediately
pause 