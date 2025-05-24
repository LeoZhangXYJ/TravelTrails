@echo off
echo ========================================
echo     Travel Trails 项目测试脚本
echo ========================================

echo 1. 检查Python环境...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python未安装或不在PATH中
    pause
    exit /b 1
)
echo ✅ Python环境正常

echo.
echo 2. 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或不在PATH中
    pause
    exit /b 1
)
echo ✅ Node.js环境正常

echo.
echo 3. 检查后端依赖...
cd user_management
python -c "import sys; print('Python版本:', sys.version)"
python -c "try: import fastapi, uvicorn, pydantic; print('✅ 后端核心依赖已安装')" except ImportError as e: print('❌ 依赖缺失:', e); exit(1)" 2>nul
if %errorlevel% neq 0 (
    echo 正在安装后端依赖...
    pip install -r requirements.txt
)

echo.
echo 4. 检查前端依赖...
cd ..\frontend
if not exist node_modules (
    echo 正在安装前端依赖...
    npm install
)
echo ✅ 前端依赖检查完成

echo.
echo 5. 测试后端配置...
cd ..\user_management
python -c "
try:
    from main import app
    from travel_routes import router
    print('✅ 后端模块导入成功')
except Exception as e:
    print('❌ 后端配置错误:', e)
    exit(1)
"

echo.
echo ========================================
echo     项目测试完成！
echo ========================================
echo 运行以下命令启动项目:
echo 1. 后端: start_backend.bat
echo 2. 前端: start_frontend.bat
echo ========================================
pause