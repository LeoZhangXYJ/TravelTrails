from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List
from user_models import User, UserUpdate, UserLogin
import uvicorn
import validator
import crud
from travel_routes import router as travel_router

app = FastAPI(title="Travel Trails API")

# 包含旅行轨迹路由
app.include_router(travel_router)

@app.get("/") # 注册路由
def root(): # 路由处理函数
    return {"message": "欢迎使用用户管理和登录API"}

# 创建用户
@app.post("/users/", status_code=201) # 注册路由，POST请求
def create_user(user: User):
    # 验证用户名、密码、邮箱和年龄
    validator.validate_username(user.username)
    validator.validate_password(user.password)
    validator.validate_email(user.email)
    validator.validate_age(user.age)
    # 添加用户
    try:
        crud.create_user(user.model_dump())
    except HTTPException as e:
        raise e
    return {"status": "success", "message": "用户创建成功"}


# 更新用户
@app.put("/users/{username}")
def update_user(username: str, user_update: UserUpdate):
    existing_user = crud.get_user(username)  # 确保存在
    update_data = user_update.model_dump(exclude_unset=True)
    # 验证
    if 'email' in update_data:
        validator.validate_email(update_data['email'])
    if 'password' in update_data:
        validator.validate_password(update_data['password'])
    if 'age' in update_data:
        validator.validate_age(update_data['age'])
    crud.update_user_info(username, update_data)
    return {"status": "success", "message": "用户信息更新成功"}

# 删除用户
@app.delete("/users/{username}")
def delete_user(username: str):
    crud.delete_user_by_username(username)
    return {"status": "success", "message": "用户已删除"}

# 登录
@app.post("/login")
def login(login_req: UserLogin):
    # 验证用户名和密码
    user = crud.get_user(login_req.username)
    if user['password'] != login_req.password:
        raise HTTPException(status_code=401, detail="账号或密码错误")
    return True

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000) # 启动应用，监听8000端口
