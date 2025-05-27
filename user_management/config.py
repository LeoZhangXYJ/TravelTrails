from pydantic import BaseSettings, SecretStr
from typing import List
import os

class Settings(BaseSettings):
    """应用配置模型"""
    # API Keys - 使用 SecretStr 类型保护敏感信息
    DEEPSEEK_API_KEY: SecretStr
    SECRET_KEY: SecretStr
    
    # 数据库配置
    DATABASE_URL: str
    
    # JWT配置
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # 服务器配置
    HOST: str
    PORT: int
    CORS_ORIGINS: List[str]
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        
settings = Settings()
