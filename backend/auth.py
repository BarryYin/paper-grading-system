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
    print(f"验证密码... (哈希前缀: {hashed_password[:10]}...)")
    
    # 检查密码是否为明文测试密码（仅开发环境使用）
    if plain_password == hashed_password:
        print("警告: 使用明文密码匹配")
        return True
    
    # 尝试使用passlib/bcrypt验证
    try:
        if pwd_context.verify(plain_password, hashed_password):
            print("密码使用bcrypt验证成功")
            return True
    except Exception as e:
        print(f"bcrypt验证失败，尝试SHA256: {e}")
    
    # 尝试SHA256验证
    try:
        sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        if sha256_hash == hashed_password:
            print("密码使用SHA256验证成功")
            return True
    except Exception as e:
        print(f"SHA256验证失败: {e}")
    
    print("所有密码验证方法均失败")
    return False

# 用户管理函数
def get_all_users() -> List[Dict[str, Any]]:
    """获取所有用户数据"""
    users = []
    try:
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 确保所有关键字段都存在
                if all(k in row for k in ['user_id', 'username', 'password_hash', 'email']):
                    users.append(dict(row))
                else:
                    missing = [k for k in ['user_id', 'username', 'password_hash', 'email'] if k not in row]
                    print(f"警告: CSV中的用户记录缺少字段: {missing}")
    except Exception as e:
        print(f"读取用户文件出错: {e}")
    
    print(f"从CSV读取了 {len(users)} 个用户记录")
    return users

def get_user(username: str) -> Optional[Dict[str, Any]]:
    """通过用户名查找用户"""
    print(f"查找用户: {username}")
    users = get_all_users()
    for user in users:
        if user['username'].lower() == username.lower():  # 不区分大小写比较
            print(f"找到用户: {username}")
            return user
    print(f"用户不存在: {username}")
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
    
    # 检查参数
    if not username or not password:
        print("错误: 用户名或密码为空")
        return None
    
    user = get_user(username)
    if not user:
        print(f"用户 {username} 不存在")
        return None
    
    print(f"找到用户记录，检验密码...")
    
    # 尝试验证密码
    if verify_password(password, user['password_hash']):
        print(f"用户 {username} 密码验证成功")
        return User(
            user_id=user['user_id'],
            username=user['username'],
            email=user['email'],
            disabled=False
        )
    
    print(f"用户 {username} 密码验证失败")
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

# 添加token黑名单存储
# 在生产环境中，这应该使用Redis或其他持久化存储
BLACKLISTED_TOKENS = set()

# 添加函数用于将token加入黑名单
def blacklist_token(token: str):
    BLACKLISTED_TOKENS.add(token)
    return True

# 添加函数用于检查token是否已被拉黑
def is_token_blacklisted(token: str) -> bool:
    return token in BLACKLISTED_TOKENS

# FastAPI依赖项
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> User:
    """从JWT令牌获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 检查token是否在黑名单中
    if is_token_blacklisted(token):
        raise credentials_exception
    
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
    # 添加更详细的调试信息
    print(f"检查当前用户认证状态 ({request.url.path})...")
    
    # 显示所有请求头，帮助调试
    headers = dict(request.headers.items())
    auth_header = headers.get("authorization", "")
    print(f"请求头: Authorization={auth_header[:20]}{'...' if len(auth_header) > 20 else ''}")
    
    # 显示所有cookies
    cookies = request.cookies
    auth_cookie = cookies.get("access_token", "")
    print(f"Cookies: access_token={'存在' if auth_cookie else '不存在'}")
    if auth_cookie:
        print(f"Cookie值: {auth_cookie[:20]}...")
    
    # 从认证头获取令牌
    token = None
    
    # 提取令牌，首先检查Authorization头
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        print(f"从Authorization头获取token: {token[:10]}...")
    else:
        # 从cookie尝试获取令牌
        if auth_cookie and auth_cookie.startswith("Bearer "):
            token = auth_cookie.split(" ")[1]
            print(f"从Cookie获取token: {token[:10]}...")
    
    if not token:
        print("未找到有效的认证令牌")
        return None
    
    # 检查token是否在黑名单中
    if is_token_blacklisted(token):
        print(f"令牌在黑名单中: {token[:10]}...")
        return None
    
    # 验证令牌
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print("令牌中未包含用户名(sub)")
            return None
        
        # 获取用户数据
        user_data = get_user(username)
        if user_data:
            print(f"认证成功: {username}")
            return User(
                user_id=user_data['user_id'],
                username=user_data['username'],
                email=user_data['email'],
                disabled=False  # 默认未禁用
            )
        else:
            print(f"找不到用户: {username}")
    except jwt.ExpiredSignatureError:
        print("令牌已过期")
        return None
    except jwt.InvalidTokenError:
        print("无效的令牌")
        return None
    except Exception as e:
        print(f"令牌验证时发生错误: {e}")
        return None
    
    return None

async def require_user(current_user: Optional[User] = Depends(get_current_user)) -> User:
    """要求用户已登录"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return current_user

# 添加用于验证CSV文件完整性的函数
def validate_users_csv() -> bool:
    """验证用户CSV文件的完整性"""
    try:
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            
            # 检查标题行是否包含所需字段
            required_fields = ['user_id', 'username', 'password_hash', 'email', 'created_at']
            missing_fields = [field for field in required_fields if field not in header]
            
            if missing_fields:
                print(f"警告: CSV文件缺少必要字段: {missing_fields}")
                return False
            
            # 检查数据行
            row_count = 0
            for row in reader:
                row_count += 1
                if len(row) != len(header):
                    print(f"警告: 第{row_count}行的列数({len(row)})与标题行({len(header)})不匹配")
                    return False
            
            print(f"CSV文件格式验证成功: {row_count}行数据")
            return True
    except Exception as e:
        print(f"验证CSV文件时出错: {e}")
        return False

# 确保在启动时验证CSV文件
if not validate_users_csv():
    print("警告: 用户CSV文件验证失败，可能会导致认证问题")

# 添加测试用户
ensure_test_users_exist()