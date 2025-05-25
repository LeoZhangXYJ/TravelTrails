# backend/config.py
# 配置文件，用于存储数据库连接字符串、API密钥等敏感或环境相关的信息

import os

# 数据库配置 (示例，后续根据实际选择的数据库进行修改)
DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///./backend/data_access_layer/default_travel_trails.db") # 更具体的默认路径

# AI 服务相关的配置
AI_MODEL_ENDPOINT = os.environ.get("AI_MODEL_ENDPOINT", "https://chat.zju.edu.cn/api/ai/v1/chat/completions") # 默认使用浙大端点
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

# JWT 或其他认证相关的配置
SECRET_KEY = os.environ.get("SECRET_KEY", "a_very_secret_key_for_dev_please_change_this")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# CORS 配置 (逗号分隔的源列表字符串)
CORS_ALLOWED_ORIGINS_STRING = os.environ.get("CORS_ALLOWED_ORIGINS")

# 其他配置...
# DEBUG_MODE 通常由 Uvicorn 的 --reload 标志控制，或在 FastAPI 实例化时设置
# DEBUG_MODE = os.environ.get("BACKEND_DEBUG_MODE", "True").lower() in ["true", "1", "t"] 