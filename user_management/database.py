import json
import os

file = 'users.json'

# 加载文件并检查文件是否存在，如果不存在则创建一个空的JSON文件
def load_users():
    if not os.path.exists(file):
        return []
    with open(file, 'r',encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = []
    return data

# 保存用户数据到文件
def save_users(users):
    with open(file, 'w',encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

# 查找用户
def find_user(username):
    users = load_users()
    for user in users:
        if user['username'] == username:
            return user
    return None

# 添加用户
def add_user(user_dict):
    users = load_users()
    users.append(user_dict)
    save_users(users)

# 更新用户数据
def update_user(username, user_dict):
    users = load_users()
    for u in users:
        if u['username'] == username:
            u.update(user_dict)
            break
    save_users(users)

# 删除用户
def delete_user(username):
    users = load_users()
    users = [u for u in users if u['username'] != username]
    save_users(users)
