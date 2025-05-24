@echo off
REM Batch script to start TravelTrails services

REM Get the directory of the batch file
SET SCRIPT_DIR=%~dp0

REM Set project base path relative to the script's location
SET PROJECT_BASE_PATH=%SCRIPT_DIR%

echo Starting services...

REM Start User Management Backend (FastAPI)
echo Starting User Management Backend...
cd /d "%PROJECT_BASE_PATH%user_management"
start "UserManagementAPI" cmd /k "python main.py"

REM Start AI Recommendation API (Assuming it runs on port 8001 or similar)
echo Starting AI Recommendation API...
cd /d "%PROJECT_BASE_PATH%AI-APIdemo"
REM TODO: Adjust the command below if apiTest.py needs a specific way to run (e.g., uvicorn, flask run)
REM If apiTest.py is a FastAPI app, it might be: uvicorn apiTest:app --port 8001
start "AIRecommendationAPI" cmd /k "python apiTest.py"

REM Start Frontend (React)
echo Starting Frontend Development Server...
cd /d "%PROJECT_BASE_PATH%frontend"
start "FrontendDevServer" cmd /k "npm start"

echo All services are attempting to start in new command prompt windows.
REM Prevent the main batch file window from closing immediately
pause 