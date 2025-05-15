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


######
#用户模型存储不应该是只有这些东西，还要考虑存储的轨迹数据、各个轨迹点的图片、Blog的数据
#只是说像作业那样,没说完全一样
#如何存储用户模型，接口设计，参考前端里的数据是如何存储的，然后想出分析他的接口
######