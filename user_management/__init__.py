# This file makes the directory a Python package 
"""
Travel Trails - 用户管理模块
此模块提供用户认证、授权和旅行轨迹管理功能
"""

__version__ = "1.0.0"
__author__ = "TravelTrails Team"

from fastapi.middleware.cors import CORSMiddleware
# 导入配置
from .config import settings
# 导入模块组件
from .main import app
from .travel_routes import router as travel_router
from .user_models import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserLogin,
    City,
    TravelTrail
)

# 配置信息 - 只暴露非敏感配置
CONFIG = {
    "HOST": settings.HOST,
    "PORT": settings.PORT,
    "CORS_ORIGINS": settings.CORS_ORIGINS,
    "DATABASE_URL": settings.DATABASE_URL.replace("://", "****").replace("@", "****"),  # 隐藏数据库凭证
    "JWT_ALGORITHM": settings.ALGORITHM,
    "ACCESS_TOKEN_EXPIRE_MINUTES": settings.ACCESS_TOKEN_EXPIRE_MINUTES
}

# 导出所有需要的组件
__all__ = [
    "app",
    "travel_router",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserLogin",
    "City",
    "TravelTrail",
    "CONFIG",
    "settings"  # 导出设置但内部处理敏感信息
]

def init_app():
    """初始化应用"""
    # 设置CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 包含旅行轨迹路由
    app.include_router(travel_router, prefix="/travel", tags=["travel"])
    
    return app
