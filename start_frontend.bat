@echo off
echo ========================================
echo     启动 Travel Trails 前端服务
echo ========================================
cd /d "%~dp0frontend"
echo 当前目录: %CD%
echo.
echo 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js环境，请先安装Node.js
    pause
    exit /b 1
)

npm --version
if %errorlevel% neq 0 (
    echo 错误: 未找到npm，请检查Node.js安装
    pause
    exit /b 1
)

echo.
echo 安装前端依赖...
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 启动前端开发服务器 (端口 3000)...
echo 请访问: http://localhost:3000
echo 按 Ctrl+C 停止服务
echo.
npm start 