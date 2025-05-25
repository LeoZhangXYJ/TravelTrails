# backend/main.py

import os # 确保 os 在 dotenv 前导入以避免潜在问题
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 在导入任何可能依赖环境变量的模块 (如 config) 之前加载 .env 文件
# 假设 .env 文件在项目的根目录，即 backend 目录的上一级
# 获取当前 main.py 文件所在的目录 (backend)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# 获取项目根目录 (backend 的上一级)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
# 构建 .env 文件的完整路径
_ENV_FILE_PATH = os.path.join(_PROJECT_ROOT, ".env")

# 加载 .env 文件 (如果存在)
if os.path.exists(_ENV_FILE_PATH):
    load_dotenv(dotenv_path=_ENV_FILE_PATH)
    print(f"[MAIN] Loaded .env file from: {_ENV_FILE_PATH}")
else:
    print(f"[MAIN] .env file not found at: {_ENV_FILE_PATH}. Using system environment variables or defaults.")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 从 presentation_layer 导入路由
from .presentation_layer.routes import ai_router, user_router, auth_router
from .presentation_layer.travel_router import router as travel_router
from .config import CORS_ALLOWED_ORIGINS_STRING # 导入配置

# TODO: 数据库初始化 (如果使用 SQLAlchemy，可以在启动时调用 init_db)
# from .data_access_layer.models import init_db
# from .data_access_layer.user_management_dao import USERS_FILE # for creating dummy file
# import os # for creating dummy file

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("TravelTrails Backend API 启动中...")
    # 尝试创建空的 users.json (如果不存在)，以便 DAO 初始化时不会失败
    # user_json_path = os.path.join(os.path.dirname(__file__), "data_access_layer", "users.json")
    # if not os.path.exists(user_json_path):
    #     try:
    #         with open(user_json_path, "w", encoding="utf-8") as f:
    #             json.dump({}, f)
    #         print(f"Created empty users.json at {user_json_path}")
    #     except Exception as e:
    #         print(f"Could not create users.json: {e}")
    # init_db() # 数据库初始化
    
    yield
    
    # Shutdown
    print("TravelTrails Backend API 关闭中...")

app = FastAPI(
    title="TravelTrails Backend API",
    description="后端服务，提供 AI 旅行推荐和用户管理功能。",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
# 默认允许的源列表
default_origins = [
    "http://localhost:3000",  
    "http://127.0.0.1:3000",
    "http://localhost:3001",  
]

# 如果从环境变量中读取到了CORS配置，则使用它，否则使用默认列表
if CORS_ALLOWED_ORIGINS_STRING:
    configured_origins = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STRING.split(',')]
    allow_origins_list = configured_origins
else:
    allow_origins_list = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(ai_router)
app.include_router(auth_router) # 认证路由，例如 /auth/login, /auth/register
app.include_router(user_router) # 用户信息路由，例如 /users/me
app.include_router(travel_router, prefix="/users") # 挂载到 /users/{username}/cities 等

@app.get("/", tags=["Root"])
async def read_root():
    """API 根路径，返回欢迎信息。"""    
    return {"message": "欢迎使用 TravelTrails Backend API", "version": app.version}

# uvicorn backend.main:app --reload --port 8008

# 如果希望直接通过 python backend/main.py 启动 (需要 uvicorn 安装在环境中)
# if __name__ == "__main__":
#     import uvicorn
#     import os
#     port = int(os.getenv("PORT", 8008)) # 使用与 user_management 不同的端口以避免冲突
#     host = os.getenv("HOST", "127.0.0.1")
#     uvicorn.run(app, host=host, port=port) 