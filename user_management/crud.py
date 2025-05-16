from database import load_users, save_users, find_user, add_user, delete_user, update_user
from fastapi import HTTPException

# 创建用户
def create_user(user_data):
    if find_user(user_data['username']):
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="用户已存在"
        )    
    add_user(user_data)

# 获取单个用户
def get_user(username):
    user = find_user(username)
    if not user:
        raise HTTPException(
            status_code=404, # Not Found
            detail="用户不存在"
        )
    return user

# 获取所有用户，支持分页和过滤
# offset: 偏移量，默认0
# limit: 每页数量，默认10，最大100
def get_all_users(offset=0,limit=10,min_age=None,max_age=None):
    users = load_users()
    if offset < 0 or limit > 100:
        raise HTTPException(
            status_code=422, # Unprocessable Entity
            detail="偏移量和限制必须在0到100之间"
        )
    if min_age is not None:
        users = [user for user in users if user.get('age', 0) >= min_age]
    if max_age is not None:
        users = [user for user in users if user.get('age', 0) <= max_age]
    return users[offset:offset+limit]

# 更新用户信息
def update_user_info(username, update_data):
    user = get_user(username)
    # 合法性验证
    update_user(username, update_data)

# 删除用户
def delete_user_by_username(username):
    user = get_user(username)  # 若不存在会报404
    delete_user(username)

# 添加新函数来更新用户数据
def update_user_data(username, user_data):
    users = load_users()
    for i, user in enumerate(users):
        if user['username'] == username:
            users[i] = user_data
            save_users(users)
            return
    raise HTTPException(
        status_code=404,
        detail="用户不存在"
    )
