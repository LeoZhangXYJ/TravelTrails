import re
from fastapi import HTTPException
from typing import Optional

def validate_username(username: str):
    if not re.match(r"^[a-zA-Z0-9_\u4e00-\u9fa5]{3,50}$", username):
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="用户名必须是3到50个字符的字母、数字、下划线或中文的组合"
        )
    
def validate_email(email: str):
    if email is None or len(email) == 0:
        return 
    # EmailStr已验证格式，可额外检查
    pass

def validate_password(password: str):
    if password is None or len(password) == 0:
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="密码不能为空"
        )
    if len(password) < 8:
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="密码长度至少为8个字符"
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="密码必须包含至少一个大写字母"
        )
    if not re.search(r'\d',password):
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="密码必须包含至少一个数字"
        )

def validate_age(age: Optional[int]):
    if age is not None and age <= 0:
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="年龄必须是正整数"
        )
    
