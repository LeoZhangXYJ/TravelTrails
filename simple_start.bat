@echo off
chcp 65001 >nul
echo ========================================
echo     Travel Trails - Simple Start
echo ========================================
echo.
echo Starting all services...
echo.

REM 检查Python环境
echo Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python not found, please install Python first
    pause
    exit /b 1
)

REM 检查Node.js环境
echo Checking Node.js environment...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found, please install Node.js first
    pause
    exit /b 1
)

echo.
echo ========================================
echo     Starting Backend Services
echo ========================================

REM 启动主后端服务 (main.py)
echo Starting main backend service on port 8001...
start "Travel Trails Backend" cmd /k "cd /d %~dp0user_management && set PORT=8001 && python main.py"

REM 等待2秒让主服务启动
timeout /t 2 /nobreak >nul

REM 启动AI API测试服务 (apiTest.py)
echo Starting AI API test service on port 8002...
start "Travel Trails AI API" cmd /k "cd /d %~dp0AI-APIdemo && python apiTest.py"

REM 等待3秒让后端服务完全启动
echo Waiting for backend services to start...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo     Starting Frontend Service
echo ========================================

REM 启动前端服务
echo Starting frontend development server...
echo Please wait for the frontend to compile...
echo.
cd /d "%~dp0frontend"
npm start

echo.
echo ========================================
echo     All Services Started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8001
echo AI API: http://localhost:8002
echo API Documentation: http://localhost:8001/docs
echo.
echo Press Ctrl+C in any window to stop the respective service
echo Close this window to return to command prompt
echo.
pause