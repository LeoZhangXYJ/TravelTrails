# backend/presentation_layer/schemas.py
# 此文件用于定义 API 请求和响应的数据模型 (Pydantic Schemas)

from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime

# --- AI Recommendation Schemas (from AI_rmd.py) ---
class CityInputSchema(BaseModel):
    city: str
    country: str

class VisitedCitiesRequestSchema(BaseModel):
    visitedCities: List[CityInputSchema]

class RecommendationResponseSchema(BaseModel):
    city: str
    country: str
    inferred_preferences: List[str]
    reason: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# --- User Management Schemas (from user_models.py & user_management/main.py) ---
class UserBaseSchema(BaseModel):
    username: str
    email: EmailStr

class UserCreateSchema(UserBaseSchema):
    password: str

class UserUpdateSchema(BaseModel): # 保持与原 user_management/main.py 一致性，允许只更新部分字段
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    age: Optional[int] = None # from user_models.User

class UserResponseSchema(UserBaseSchema):
    age: Optional[int] = None
    # disabled: bool # 原 users.json 中有，但 API 层面未直接暴露，按需添加
    # travel_trails: Optional[List[TravelTrailSchema]] = [] # 稍后定义 TravelTrailSchema

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    username: str
    email: EmailStr

# --- Travel Trail Schemas (from user_models.py - 初始定义，可能需要调整) ---
class PhotoSchema(BaseModel):
    data: str  # Base64编码的图片数据

class CitySchema(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    transport_mode: Optional[str] = None
    photos: Optional[List[PhotoSchema]] = []
    blog: Optional[str] = None
    visit_date: Optional[datetime] = None

class TravelTrailSchema(BaseModel):
    cities: List[CitySchema] = []

class UserWithTravelTrailsSchema(UserResponseSchema):
    travel_trails: Optional[List[TravelTrailSchema]] = []

# 用于城市操作的模型 (from user_models.py)
class CityCreateSchema(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    transport_mode: Optional[str] = None

class CityUpdateSchema(BaseModel):
    blog: Optional[str] = None 