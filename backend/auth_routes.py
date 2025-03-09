from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from .auth import auth_service, get_current_user, User

router = APIRouter()

# 请求模型
class UserRegisterRequest(BaseModel):
    username: str
    password: str
    email: str

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str

# 注册新用户
@router.post("/register", response_model=UserResponse)
async def register(request: UserRegisterRequest):
    try:
        user = auth_service.register_user(
            username=request.username,
            password=request.password,
            email=request.email
        )
        return UserResponse(
            user_id=user.user_id,
            username=user.username,
            email=user.email
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

# 用户登录
@router.post("/login")
async def login(request: UserLoginRequest, response: Response):
    try:
        user, session_id = auth_service.login(
            username=request.username,
            password=request.password
        )
        
        # 设置会话Cookie，确保跨域环境中正确工作
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            max_age=86400 * 7,  # 7天
            samesite="lax",  # 允许从同一站点的链接导航时发送cookie
            secure=False,  # 开发环境设为False，生产环境应设为True
            path="/",  # 确保cookie对整个站点可用
            domain=None  # 自动使用当前域名
        )
        
        return {
            "success": True,
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

# 用户登出
@router.post("/logout")
async def logout(response: Response, request: Request):
    session_id = request.cookies.get("session_id")
    if session_id:
        auth_service.logout(session_id)
    
    # 清除Cookie，确保设置正确的path
    response.delete_cookie(
        key="session_id",
        path="/",
        domain=None,
        secure=False,
        httponly=True
    )
    
    return {"success": True}

# 获取当前用户信息
@router.get("/me", response_model=Optional[UserResponse])
async def get_me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        return None
    
    return UserResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        email=current_user.email
    )

# 检查用户是否已登录
@router.get("/check")
async def check_auth(current_user: Optional[User] = Depends(get_current_user)):
    return {"authenticated": current_user is not None}