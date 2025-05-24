@echo off
echo ========================================
echo     启动 Travel Trails 后端服务
echo ========================================
cd /d "%~dp0user_management"
echo 当前目录: %CD%
echo.
echo 检查Python环境...
python --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Python环境，请先安装Python
    pause
    exit /b 1
)

echo.
echo 安装后端依赖...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 启动后端服务 (端口 8000)...
echo 请访问: http://localhost:8000/docs 查看API文档
echo 按 Ctrl+C 停止服务
echo.
python main.py
pause 