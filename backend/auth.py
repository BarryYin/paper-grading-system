import os
import csv
import uuid
import hashlib
import time
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple, Any
from fastapi import HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# 导入必要的模块
try:
    from passlib.context import CryptContext
    import jwt
except ImportError as e:
    module_name = str(e).split("'")[-2]
    raise ImportError(
        f"缺少必要的依赖项: {module_name}。请运行 'python install_dependencies.py' 安装所有依赖，"
        f"或者手动执行 'pip install passlib[bcrypt] python-jose[cryptography]'"
    ) from e

# 路径设置
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.csv')
SESSIONS_FILE = os.path.join(BACKEND_DIR, 'sessions.json')

# 加密设置
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# 用户模型
class User(BaseModel):
    user_id: str
    username: str
    email: Optional[str] = None
    disabled: Optional[bool] = None

# 确保文件存在
def ensure_files_exist():
    # 确保用户文件存在
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['user_id', 'username', 'password_hash', 'email', 'created_at'])
            print(f"创建新用户文件: {USERS_FILE}")
    
    # 确保会话文件存在
    if not os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
            f.write('{}')
            print(f"创建新会话文件: {SESSIONS_FILE}")

# 添加测试用户
def ensure_test_users_exist():
    users = get_all_users()
    usernames = {user['username'] for user in users}
    
    test_users = [
        {
            'user_id': 'test-id-123',
            'username': 'test',
            'password': 'test',
            'email': 'test@example.com',
        },
        {
            'user_id': 'admin-id-456',
            'username': 'admin', 
            'password': 'admin',
            'email': 'admin@example.com',
        }
    ]
    
    for test_user in test_users:
        if test_user['username'] not in usernames:
            # 创建用户
            create_user(
                test_user['username'],
                test_user['email'],
                test_user['password'],
                user_id=test_user['user_id']
            )
            print(f"添加测试用户: {test_user['username']}")

# 确保文件存在
ensure_files_exist()

# 密码处理函数
def get_password_hash(password: str) -> str:
    """使用安全的哈希方法处理密码"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否匹配哈希值"""
    # 尝试使用passlib验证
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception as e:
        print(f"bcrypt验证失败，尝试SHA256: {e}")
    
    # 备选方案：使用SHA256验证
    sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return sha256_hash == hashed_password

# 用户管理函数
def get_all_users() -> List[Dict[str, Any]]:
    """获取所有用户数据"""
    users = []
    try:
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                users.append(dict(row))
    except Exception as e:
        print(f"读取用户文件出错: {e}")
    return users

def get_user(username: str) -> Optional[Dict[str, Any]]:
    """通过用户名查找用户"""
    users = get_all_users()
    for user in users:
        if user['username'] == username:
            return user
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """通过ID查找用户"""
    users = get_all_users()
    for user in users:
        if user['user_id'] == user_id:
            return user
    return None

def authenticate_user(username: str, password: str) -> Optional[User]:
    """验证用户凭据并返回用户信息"""
    print(f"尝试验证用户: {username}")
    
    user = get_user(username)
    if not user:
        print(f"用户 {username} 不存在")
        return None
    
    print(f"找到用户: {username}")
    if verify_password(password, user['password_hash']):
        print("密码验证成功")
        return User(
            user_id=user['user_id'],
            username=user['username'],
            email=user['email'],
            disabled=False  # 默认未禁用
        )
    
    print("密码验证失败")
    return None

def create_user(username: str, email: str, password: str, user_id: str = None) -> Optional[User]:
    """创建新用户"""
    # 检查用户是否已存在
    if get_user(username):
        print(f"用户名 {username} 已存在")
        return None
    
    # 生成用户ID (如果未提供)
    if not user_id:
        user_id = str(uuid.uuid4())
    
    # 创建时间
    created_at = datetime.now().isoformat()
    
    # 密码哈希
    password_hash = get_password_hash(password)
    
    # 写入CSV文件
    try:
        with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([user_id, username, password_hash, email, created_at])
            print(f"成功创建用户: {username}")
        
        # 返回用户对象
        return User(
            user_id=user_id,
            username=username,
            email=email,
            disabled=False
        )
    except Exception as e:
        print(f"创建用户失败: {e}")
        return None

# 会话和令牌管理
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    to_encode = data.copy()
    
    # 设置过期时间
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    # 编码令牌
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# FastAPI依赖项
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> User:
    """从JWT令牌获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user_data = get_user(username)
    if user_data is None:
        raise credentials_exception
    
    return User(
        user_id=user_data['user_id'],
        username=user_data['username'],
        email=user_data['email'],
        disabled=False  # 默认未禁用
    )

async def get_current_user(request: Request) -> Optional[User]:
    """从请求中获取当前用户(基于令牌或cookie)"""
    # 从认证头获取令牌
    auth_header = request.headers.get("Authorization", "")
    token = None
    
    # 提取令牌
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        # 从cookie尝试获取令牌
        token_cookie = request.cookies.get("access_token", "")
        if token_cookie and token_cookie.startswith("Bearer "):
            token = token_cookie.split(" ")[1]
    
    if not token:
        return None
    
    # 验证令牌
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # 获取用户数据
        user_data = get_user(username)
        if user_data:
            return User(
                user_id=user_data['user_id'],
                username=user_data['username'],
                email=user_data['email'],
                disabled=False  # 默认未禁用
            )
    except jwt.PyJWTError:
        return None
    
    return None

async def require_user(current_user: Optional[User] = Depends(get_current_user)) -> User:
    """要求用户已登录"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return current_user

# 添加测试用户
ensure_test_users_exist()