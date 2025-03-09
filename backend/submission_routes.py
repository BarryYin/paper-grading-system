from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import uuid
from datetime import datetime

# 导入用户认证
try:
    from auth import User, require_user
except ImportError:
    from .auth import User, require_user

router = APIRouter()

# 数据模型
class SubmissionBase(BaseModel):
    title: str
    content: str
    author: str
    course: str
    description: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: str
    created_at: str
    updated_at: str
    status: str = "pending"
    grade: Optional[float] = None
    feedback: Optional[str] = None

# 模拟数据存储 - 在实际应用中应替换为数据库
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
SUBMISSIONS_FILE = os.path.join(DATA_DIR, "submissions.json")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 加载论文提交数据
def load_submissions():
    try:
        if not os.path.exists(SUBMISSIONS_FILE):
            with open(SUBMISSIONS_FILE, 'w') as f:
                json.dump([], f)
            return []
        
        with open(SUBMISSIONS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载论文数据失败: {e}")
        return []

# 保存论文提交数据
def save_submissions(submissions):
    try:
        with open(SUBMISSIONS_FILE, 'w') as f:
            json.dump(submissions, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存论文数据失败: {e}")
        return False

# 生成唯一ID，模拟数据库自增ID
def generate_id():
    # 使用rec前缀+随机字符，类似Airtable ID
    return f"rec{uuid.uuid4().hex[:8]}"

# 获取所有论文
@router.get("/submissions", response_model=List[SubmissionResponse])
async def get_all_submissions(current_user: User = Depends(require_user)):
    submissions = load_submissions()
    return submissions

# 通过ID获取论文详情
@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(submission_id: str, current_user: User = Depends(require_user)):
    """获取论文详情，添加详细的日志处理"""
    # 添加详细日志
    print(f"请求论文详情 ID = '{submission_id}'")
    print(f"请求用户: {current_user.username}")
    
    submissions = load_submissions()
    print(f"已加载 {len(submissions)} 篇论文")
    
    # 记录所有可用ID，便于调试
    available_ids = [sub.get("id") for sub in submissions]
    print(f"可用论文ID: {available_ids}")
    
    # 查找匹配ID的论文
    for submission in submissions:
        if submission.get("id") == submission_id:
            print(f"找到论文 ID='{submission_id}', 标题: {submission.get('title', '无标题')}")
            return submission
    
    # 没找到则返回404
    print(f"未找到论文 ID='{submission_id}'")
    raise HTTPException(
        status_code=404, 
        detail=f"论文未找到 (ID: {submission_id})"
    )

# 创建新论文
@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(submission: SubmissionCreate, current_user: User = Depends(require_user)):
    submissions = load_submissions()
    
    # 创建新论文对象
    now = datetime.now().isoformat()
    new_submission = {
        "id": generate_id(),
        "title": submission.title,
        "content": submission.content,
        "author": submission.author,
        "course": submission.course,
        "description": submission.description,
        "created_at": now,
        "updated_at": now,
        "status": "pending",
        "grade": None,
        "feedback": None
    }
    
    submissions.append(new_submission)
    save_submissions(submissions)
    
    return new_submission

# 更新论文
@router.put("/submissions/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str, 
    submission_update: Dict[str, Any],
    current_user: User = Depends(require_user)
):
    submissions = load_submissions()
    
    for i, submission in enumerate(submissions):
        if submission.get("id") == submission_id:
            # 更新字段，保留ID和创建时间
            submission_id = submission["id"]
            created_at = submission["created_at"]
            
            # 更新提供的字段
            for key, value in submission_update.items():
                if key not in ["id", "created_at"]:  # 防止修改这些字段
                    submission[key] = value
            
            # 更新时间戳
            submission["updated_at"] = datetime.now().isoformat()
            
            submissions[i] = submission
            save_submissions(submissions)
            return submission
    
    raise HTTPException(status_code=404, detail="论文未找到")

# 删除论文
@router.delete("/submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(submission_id: str, current_user: User = Depends(require_user)):
    submissions = load_submissions()
    
    for i, submission in enumerate(submissions):
        if submission.get("id") == submission_id:
            del submissions[i]
            save_submissions(submissions)
            return
    
    raise HTTPException(status_code=404, detail="论文未找到")

# 添加评分和反馈
@router.post("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    grading_data: Dict[str, Any],
    current_user: User = Depends(require_user)
):
    submissions = load_submissions()
    
    for i, submission in enumerate(submissions):
        if submission.get("id") == submission_id:
            # 更新评分信息
            if "grade" in grading_data:
                submission["grade"] = grading_data["grade"]
            
            if "feedback" in grading_data:
                submission["feedback"] = grading_data["feedback"]
            
            if "status" in grading_data:
                submission["status"] = grading_data["status"]
            else:
                submission["status"] = "graded"  # 默认更新状态
            
            # 更新时间戳
            submission["updated_at"] = datetime.now().isoformat()
            
            submissions[i] = submission
            save_submissions(submissions)
            return submission
    
    raise HTTPException(status_code=404, detail="论文未找到")
