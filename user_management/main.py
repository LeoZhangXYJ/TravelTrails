from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import json
import os
import uvicorn
import validator
import crud
from travel_routes import router as travel_router

app = FastAPI(title="Travel Trails API")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全配置
SECRET_KEY = "your-secret-key-here"  # 在生产环境中应该使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# 数据模型
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# 用户数据文件路径
USERS_FILE = "users.json"

def load_users() -> Dict[str, dict]:
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
        except json.JSONDecodeError:
            return {}
    return {}

def save_users(users: Dict[str, dict]):
    with open(USERS_FILE, "w", encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(username: str) -> Optional[UserInDB]:
    users = load_users()
    if username in users:
        user_dict = users[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# 包含旅行轨迹路由
app.include_router(travel_router)

@app.get("/")
def root():
    return {"message": "欢迎使用Travel Trails API"}

@app.post("/auth/register", response_model=UserBase)
async def register(user: UserCreate):
    users = load_users()
    if user.username in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "disabled": False
    }
    
    users[user.username] = user_dict
    save_users(users)
    return UserBase(username=user.username, email=user.email)

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@app.get("/users/me", response_model=UserBase)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=UserBase)
async def update_user(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    users = load_users()
    user_dict = users[current_user.username]
    
    if user_update.password:
        user_dict["hashed_password"] = get_password_hash(user_update.password)
    user_dict["email"] = user_update.email
    
    users[current_user.username] = user_dict
    save_users(users)
    
    return UserBase(username=current_user.username, email=user_update.email)

@app.delete("/users/me")
async def delete_user(current_user: UserInDB = Depends(get_current_user)):
    users = load_users()
    if current_user.username in users:
        del users[current_user.username]
        save_users(users)
    return {"message": "User deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
