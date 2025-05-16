from pydantic import BaseModel, EmailStr, HttpUrl, FilePath
from typing import Optional, List, Dict
from datetime import datetime

class Photo(BaseModel):
    data: str  # Base64编码的图片数据

class City(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    transport_mode: Optional[str] = None
    photos: Optional[List[Photo]] = []
    blog: Optional[str] = None
    visit_date: Optional[datetime] = None

class TravelTrail(BaseModel):
    cities: List[City] = []
    
class User(BaseModel):
    username: str
    email: EmailStr
    age: Optional[int] = None
    password: str
    travel_trails: Optional[List[TravelTrail]] = []

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# 用于城市操作的模型
class CityCreate(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    transport_mode: Optional[str] = None

class CityUpdate(BaseModel):
    blog: Optional[str] = None
