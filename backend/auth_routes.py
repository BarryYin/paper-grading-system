from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
import os
import csv

# 从auth导入所需函数和变量，添加blacklist_token
try:
    from auth import (
        User, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, 
        require_user, create_user, SECRET_KEY, ALGORITHM, blacklist_token,
        USERS_FILE, get_all_users, verify_password  # 添加新的导入
    )
except ImportError:
    from .auth import (
        User, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
        require_user, create_user, SECRET_KEY, ALGORITHM, blacklist_token,
        USERS_FILE, get_all_users, verify_password  # 添加新的导入
    )

# 导入user_utils
try:
    from user_utils import list_all_users, test_user_password, fix_password_hash
except ImportError:
    from .user_utils import list_all_users, test_user_password, fix_password_hash

router = APIRouter()

# 数据模型
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class LoginResponse(BaseModel):
    user: User
    token: str

# 登录端点 - 表单数据
@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 设置cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # 开发环境设为False，生产环境应设为True
    )
    
    return {
        "user": user,
        "token": access_token
    }

# 登录端点 - JSON数据（增强版）
@router.post("/login/json", response_model=LoginResponse)
async def login_json(
    response: Response,
    credentials: dict
):
    username = credentials.get("username", "")
    password = credentials.get("password", "")
    
    # 增加日志
    print(f"尝试登录 - 用户名: {username}, CSV文件: {os.path.basename(USERS_FILE)}")
    
    # 验证用户
    user = authenticate_user(username, password)
    if not user:
        # 添加更详细的错误日志
        print(f"登录失败 - 用户名: {username}, 原因: 用户名或密码错误")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 设置cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    print(f"登录成功 - 用户: {user.username} (ID: {user.user_id})")
    
    return {
        "user": user,
        "token": access_token
    }

# 用户注册
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    # 创建新用户
    new_user = create_user(user_data.username, user_data.email, user_data.password)
    
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 添加日志
    print(f"用户注册成功: {new_user.username}, ID: {new_user.user_id}")
    
    return {
        "message": "用户创建成功", 
        "user_id": new_user.user_id,
        "username": new_user.username,
        "email": new_user.email
    }

# 获取当前用户信息
@router.get("/me", response_model=LoginResponse)
async def read_users_me(response: Response, current_user: User = Depends(require_user)):
    # 刷新token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )
    
    # 更新cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    return {
        "user": current_user,
        "token": access_token
    }

# 改进登出函数
@router.post("/logout")
async def logout(response: Response, request: Request):
    # 获取当前token并加入黑名单
    auth_header = request.cookies.get("access_token") or request.headers.get("Authorization")
    if auth_header:
        # 从"Bearer xxxxx"格式中提取token
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            # 将token加入黑名单
            blacklist_token(token)
            print(f"Token已加入黑名单: {token[:10]}...")
    
    cookie_name = "access_token"
    
    # 尝试所有可能的路径和域名组合来删除cookie
    paths = ["/", "/api", ""]
    domains = [None]
    
    # 获取当前域名并添加到domains列表
    host = request.headers.get("host", "").split(":")[0]
    if host and host != "localhost":
        domains.append(host)
        # 如果是子域名，尝试添加主域名
        parts = host.split(".")
        if len(parts) > 2:
            domains.append(".".join(parts[-2:]))
    
    # 通过各种组合删除cookie
    for path in paths:
        for domain in domains:
            response.delete_cookie(
                key=cookie_name,
                path=path,
                domain=domain,
                httponly=True,
                samesite="lax",
                secure=False,
            )
    
    # 设置过期的cookie
    response.set_cookie(
        key=cookie_name,
        value="",
        max_age=0,
        expires="Thu, 01 Jan 1970 00:00:00 GMT",
        path="/",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    
    # 设置缓存控制头
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "-1"
    
    # 明确告诉前端清除本地存储
    return {
        "message": "成功登出", 
        "status": "success", 
        "clearStorage": True,
        "redirect": "/login"
    }

# 添加调试端点用于查看cookie
@router.get("/debug-cookies")
async def debug_cookies(request: Request):
    """调试端点，显示当前所有cookies"""
    cookies = request.cookies
    return {
        "cookies": cookies,
        "has_access_token": "access_token" in cookies,
        "token_value": cookies.get("access_token", "无")
    }

# 修改调试登录端点，删除自动回退到测试账户的行为
@router.post("/debug-login", response_model=LoginResponse)
async def debug_login(response: Response, credentials: dict):
    """调试用登录接口，严格使用用户提供的凭据验证，不自动回退到测试账户"""
    print(f"接收到调试登录请求: {credentials}")
    
    # 获取用户提供的凭据
    username = credentials.get("username", "")
    password = credentials.get("password", "")
    use_test_account = credentials.get("use_test_account", False)
    
    # 只有在明确指定使用测试账户时才使用测试账户
    if use_test_account:
        username = "test"
        password = "test"
        print(f"明确要求使用测试账户: {username}")
    else:
        # 验证提供的用户名和密码不为空
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名和密码不能为空"
            )
        print(f"使用提供的凭据尝试登录: {username}")
    
    # 从users.csv验证用户 - 不自动回退到测试账户
    user = authenticate_user(username, password)
    if not user:
        print(f"用户验证失败: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 创建token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    # 设置cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    print(f"登录成功 - 用户: {user.username} (ID: {user.user_id})")
    
    return {
        "user": user,
        "token": access_token
    }

# 添加用户数据调试端点（仅开发环境使用）
@router.get("/debug-users")
async def debug_users(request: Request):
    """调试端点，显示CSV中的用户信息（密码已隐藏）"""
    # 检查是否处于开发环境
    if os.environ.get("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=403, detail="只在开发环境中可用")
    
    users = get_all_users()
    # 隐藏密码哈希
    for user in users:
        if 'password_hash' in user:
            hash_len = len(user['password_hash'])
            user['password_hash'] = f"{user['password_hash'][:5]}...{user['password_hash'][-3:]}" if hash_len > 8 else "***"
        
    return {
        "users_file": USERS_FILE,
        "user_count": len(users),
        "users": users
    }

# 添加密码验证测试端点
@router.post("/debug-verify-password")
async def debug_verify_password(credentials: dict):
    """测试密码验证逻辑的端点"""
    # 检查是否处于开发环境
    if os.environ.get("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=403, detail="只在开发环境中可用")
    
    username = credentials.get("username", "")
    password = credentials.get("password", "")
    
    if not username or not password:
        return {"success": False, "message": "用户名和密码不能为空"}
    
    users = get_all_users()
    target_user = None
    
    for user in users:
        if user.get('username') == username:
            target_user = user
            break
    
    if not target_user:
        return {"success": False, "message": f"用户名 '{username}' 不存在"}
    
    # 测试密码验证
    is_valid = verify_password(password, target_user['password_hash'])
    
    return {
        "success": is_valid,
        "message": "密码验证成功" if is_valid else "密码验证失败",
        "username": username,
        "hash_type": "bcrypt" if target_user['password_hash'].startswith("$2") else "sha256/其他"
    }