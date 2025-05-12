from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: str
    email: EmailStr
    age: Optional[int] = None
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
