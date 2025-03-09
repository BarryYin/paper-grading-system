from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta

# 从auth导入所需函数和变量
try:
    from auth import (
        User, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, 
        require_user, create_user, SECRET_KEY, ALGORITHM
    )
except ImportError:
    from .auth import (
        User, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
        require_user, create_user, SECRET_KEY, ALGORITHM
    )

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

# 登录端点 - JSON数据
@router.post("/login/json", response_model=LoginResponse)
async def login_json(
    response: Response,
    credentials: dict
):
    username = credentials.get("username", "")
    password = credentials.get("password", "")
    
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
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
        secure=False,
    )
    
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

# 登出
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "成功登出"}

# 调试登录端点
@router.post("/debug-login", response_model=LoginResponse)
async def debug_login(response: Response, credentials: dict):
    """调试用登录接口，使用测试账户"""
    print(f"接收到调试登录请求: {credentials}")
    
    # 使用固定的测试用户
    username = "test"
    password = "test"
    
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="测试用户验证失败，请检查users.csv文件"
        )
    
    # 创建token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username},
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
    
    print(f"调试登录成功，使用测试用户: {username}")
    
    return {
        "user": user,
        "token": access_token
    }