"""
用户管理工具，提供对users.csv的更高级访问
"""
import os
import csv
import hashlib
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional

# 文件路径设置
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.csv')

def check_user_exists(username: str) -> bool:
    """检查用户是否存在"""
    try:
        # 使用pandas更容易处理CSV
        if os.path.exists(USERS_FILE):
            df = pd.read_csv(USERS_FILE)
            # 不区分大小写查询
            return (df['username'].str.lower() == username.lower()).any()
    except Exception as e:
        print(f"检查用户存在时出错: {e}")
    return False

def list_all_users() -> List[Dict[str, Any]]:
    """返回所有用户，便于调试"""
    try:
        if not os.path.exists(USERS_FILE):
            return []
        
        df = pd.read_csv(USERS_FILE)
        # 转换为字典列表
        users = df.to_dict('records')
        for user in users:
            # 隐藏密码哈希，仅保留前5个字符
            if 'password_hash' in user:
                hash_value = user['password_hash']
                user['password_hash'] = f"{hash_value[:5]}..." if len(hash_value) > 5 else "***"
        return users
    except Exception as e:
        print(f"列出用户时出错: {e}")
        return []

def test_user_password(username: str, password: str) -> Dict[str, Any]:
    """测试用户密码是否匹配，返回详细信息"""
    result = {
        "username": username,
        "exists": False,
        "password_tested": password is not None,
        "password_matches": False,
        "hash_info": None
    }
    
    try:
        if os.path.exists(USERS_FILE):
            df = pd.read_csv(USERS_FILE)
            # 不区分大小写查找用户
            user_row = df[df['username'].str.lower() == username.lower()]
            
            if not user_row.empty:
                result["exists"] = True
                
                if password is not None:
                    stored_hash = user_row.iloc[0]['password_hash']
                    # 尝试SHA256匹配
                    test_hash = hashlib.sha256(password.encode()).hexdigest()
                    result["password_matches"] = (test_hash == stored_hash)
                    
                    # 添加哈希信息
                    result["hash_info"] = {
                        "hash_type": "bcrypt" if stored_hash.startswith("$2") else "sha256/其他",
                        "hash_prefix": stored_hash[:10] + "..." if len(stored_hash) > 10 else stored_hash
                    }
    except Exception as e:
        print(f"测试用户密码时出错: {e}")
        result["error"] = str(e)
    
    return result

def fix_password_hash(username: str, new_password: str) -> bool:
    """修复或更新用户密码哈希"""
    try:
        if not os.path.exists(USERS_FILE):
            return False
        
        df = pd.read_csv(USERS_FILE)
        # 不区分大小写查找用户
        user_idx = df.index[df['username'].str.lower() == username.lower()]
        
        if len(user_idx) == 0:
            return False
        
        # 计算新的SHA256哈希
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # 更新密码哈希
        df.at[user_idx[0], 'password_hash'] = new_hash
        
        # 保存回CSV
        df.to_csv(USERS_FILE, index=False)
        return True
    except Exception as e:
        print(f"修复密码哈希时出错: {e}")
        return False

if __name__ == "__main__":
    # 测试代码
    print("用户工具诊断模式")
    print(f"用户文件: {USERS_FILE}")
    
    if os.path.exists(USERS_FILE):
        users = list_all_users()
        print(f"发现 {len(users)} 个用户:")
        for i, user in enumerate(users):
            print(f"{i+1}. {user.get('username')} ({user.get('email')})")
    else:
        print("用户文件不存在")
