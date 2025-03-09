import os
import csv
import uuid
import hashlib
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from fastapi import HTTPException, Depends, Cookie, Request
from fastapi.security import OAuth2PasswordBearer

# 用户CSV文件路径
USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.csv')

# 确保用户文件存在
def ensure_users_file_exists():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['user_id', 'username', 'password_hash', 'email', 'created_at'])

# 密码哈希函数
def hash_password(password: str) -> str:
    # 使用SHA-256进行简单哈希，实际应用中应使用更安全的方法如bcrypt
    return hashlib.sha256(password.encode()).hexdigest()

# 用户模型
class User:
    def __init__(self, user_id: str, username: str, password_hash: str, email: str, created_at: str):
        self.user_id = user_id
        self.username = username
        self.password_hash = password_hash
        self.email = email
        self.created_at = created_at

# 会话文件路径
SESSIONS_FILE = os.path.join(os.path.dirname(__file__), 'sessions.json')

# 确保会话文件存在
def ensure_sessions_file_exists():
    if not os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, 'w') as f:
            f.write('{}')

# 用户认证服务
class AuthService:
    def __init__(self):
        ensure_users_file_exists()
        ensure_sessions_file_exists()
        # 从文件加载会话
        self.sessions: Dict[str, Dict] = self._load_sessions()
    
    def _load_sessions(self) -> Dict[str, Dict]:
        try:
            import json
            with open(SESSIONS_FILE, 'r') as f:
                sessions = json.load(f)
                # 过滤掉已过期的会话
                current_time = time.time()
                sessions = {sid: session for sid, session in sessions.items() 
                           if session.get('expires', 0) > current_time}
                return sessions
        except Exception as e:
            print(f"加载会话数据出错: {e}")
            return {}
    
    def _save_sessions(self):
        try:
            import json
            with open(SESSIONS_FILE, 'w') as f:
                json.dump(self.sessions, f)
        except Exception as e:
            print(f"保存会话数据出错: {e}")
            # 继续执行，不中断用户操作
    
    def register_user(self, username: str, password: str, email: str) -> User:
        # 检查用户名是否已存在
        existing_users = self.get_all_users()
        if any(user.username == username for user in existing_users):
            raise HTTPException(status_code=400, detail="用户名已存在")
        
        # 创建新用户
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        created_at = datetime.now().isoformat()
        
        # 保存到CSV - 确保正确处理换行符
        try:
            with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([user_id, username, password_hash, email, created_at])
                f.flush()  # 确保数据立即写入文件
        except Exception as e:
            print(f"保存用户数据时出错: {e}")
            raise HTTPException(status_code=500, detail=f"用户数据保存失败: {str(e)}")
        
        return User(user_id, username, password_hash, email, created_at)
    
    def login(self, username: str, password: str) -> Tuple[User, str]:
        # 验证用户
        users = self.get_all_users()
        user = next((u for u in users if u.username == username), None)
        
        if not user or user.password_hash != hash_password(password):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        # 创建会话
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "user_id": user.user_id,
            "username": user.username,
            "expires": time.time() + 86400  # 24小时过期
        }
        
        # 保存会话到文件
        self._save_sessions()
        
        return user, session_id
    
    def get_current_user(self, session_id: Optional[str]) -> Optional[User]:
        if not session_id or session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # 检查会话是否过期
        if session["expires"] < time.time():
            del self.sessions[session_id]
            # 保存会话变更到文件
            self._save_sessions()
            return None
        
        # 刷新会话过期时间（延长会话有效期）
        session["expires"] = time.time() + 86400  # 重置为24小时
        self._save_sessions()
        
        # 获取用户信息
        users = self.get_all_users()
        return next((u for u in users if u.user_id == session["user_id"]), None)
    
    def logout(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            # 保存会话变更到文件
            self._save_sessions()
            return True
        return False
    
    def get_all_users(self) -> List[User]:
        users = []
        try:
            with open(USERS_FILE, 'r', newline='') as f:
                reader = csv.reader(f)
                next(reader)  # 跳过标题行
                for row in reader:
                    if len(row) >= 5:
                        users.append(User(row[0], row[1], row[2], row[3], row[4]))
        except Exception as e:
            print(f"读取用户文件出错: {e}")
        return users

# 创建认证服务实例
auth_service = AuthService()

# 依赖项：获取当前用户
async def get_current_user(request: Request) -> Optional[User]:
    session_id = request.cookies.get("session_id")
    return auth_service.get_current_user(session_id)

# 依赖项：要求用户已登录
async def require_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    return current_user