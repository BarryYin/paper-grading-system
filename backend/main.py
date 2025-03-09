from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
from pydantic import BaseModel
import lark_oapi as lark
from typing import List, Optional
import os
import tempfile
import time  # 添加缺少的time模块导入
# 修改相对导入为绝对导入
from auth import get_current_user, require_user, User
from auth_routes import router as auth_router
from submission_routes import router as submission_router  # 论文提交路由

app = FastAPI(
    title="论文评分系统API",
    description="提供论文管理和评分功能的API",
    version="1.0.0"
)

# 添加认证路由
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

# 修改CORS配置，确保cookies能正常工作
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 允许的前端源
    allow_credentials=True,  # 允许cookies
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头
    expose_headers=["Set-Cookie"],  # 确保前端可以看到Set-Cookie头
)

# 修改CORS配置，解决凭据请求问题
app.add_middleware(
    CORSMiddleware,
    # 明确指定允许的源，不使用通配符
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,  # 允许携带凭据
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义数据模型
class PaperSubmission(BaseModel):
    id: str
    username: Optional[str] = None  # 添加用户名字段
    论文标题: Optional[str] = None
    文档核心内容: Optional[str] = None
    论文目录: Optional[str] = None
    论文研究方法修改意见: Optional[str] = None
    论文研究方法得分: Optional[str] = None
    论文结构修改意见: Optional[str] = None
    论文结构得分: Optional[str] = None
    论文结论: Optional[str] = None
    论文论证逻辑修改意见: Optional[str] = None
    论文论证逻辑得分: Optional[str] = None
    论文采用论证方法: Optional[str] = None
    附件上传: Optional[List[dict]] = None
    附件内容摘要: Optional[str] = None
    论文论证逻辑完整分析: Optional[str] = None
    论文结构完整分析: Optional[str] = None
    论文研究方法完整分析: Optional[str] = None

class SubmitPaperRequest(BaseModel):
    content: str
    file_path: Optional[str] = None

class FeishuService:
    def __init__(self):
        self.client = lark.Client.builder()\
            .app_id("cli_a7dad3e298b8500e")\
            .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp")\
            .enable_set_token(True)\
            .log_level(lark.LogLevel.DEBUG)\
            .build()
        self.app_token = "EizAbvZvxaTrKlsiumGcXLBuneb"
        self.table_id = "tblIlSF9KydXg612"

    async def upload_file(self, file_path: str) -> dict:
        # 读取文件
        file = open(file_path, "rb")
        
        # 构造文件上传请求
        request = lark.drive.v1.UploadAllFileRequest.builder() \
            .request_body(lark.drive.v1.UploadAllFileRequestBody.builder()
                .file_name(os.path.basename(file_path))
                .parent_type("bitable_file")
                .parent_node(self.app_token)
                .size(str(os.path.getsize(file_path)))
                .file(file)
                .build()) \
            .build()
        
        # 发起请求
        response = self.client.drive.v1.file.upload_all(request)
        
        # 处理失败返回
        if not response.success():
            error_msg = f"文件上传失败，错误码: {response.code}, 错误信息: {response.msg}"
            print(f"API Error: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 返回文件信息
        return {
            "name": os.path.basename(file_path),
            "type": "file",
            "file_token": response.data.file_token
        }

    async def submit_paper(self, content: str, username: str = "anonymous", file_path: str = None) -> str:
        fields = {
            "文档核心内容": content,
            "论文标题": "待评分",
            "username": username,  # 添加用户名字段
            "论文目录": "",
            "论文研究方法修改意见": "",
            "论文研究方法得分": "",
            "论文结构修改意见": "",
            "论文结构得分": "",
            "论文结论": "",
            "论文论证逻辑修改意见": "",
            "论文论证逻辑得分": "",
            "论文采用论证方法": "",
            "附件内容摘要": "",
            "附件上传": [],
            "论文论证逻辑完整分析": "",
            "论文结构完整分析": "",
            "论文研究方法完整分析": ""
        }

        if file_path:
            file_info = await self.upload_file(file_path)
            fields["附件上传"] = [file_info]

        # 使用正确的方式创建请求体
        try:
            # 方法1：简单字典方式
            request_body = {"fields": fields}
            request = lark.bitable.v1.CreateAppTableRecordRequest.builder()\
                .app_token(self.app_token)\
                .table_id(self.table_id)\
                .request_body(request_body)\
                .build()
        except Exception as e:
            print(f"创建请求体失败(方法1): {e}")
            try:
                # 方法2：尝试使用builder模式
                request = lark.bitable.v1.CreateAppTableRecordRequest.builder()\
                    .app_token(self.app_token)\
                    .table_id(self.table_id)\
                    .request_body(lark.bitable.v1.CreateAppTableRecordRequestBody().builder()
                        .fields(fields)
                        .build())\
                    .build()
            except Exception as e2:
                print(f"创建请求体失败(方法2): {e2}")
                # 最后的备选方案：直接从updatefiles.py抄代码
                # 请确认updatefiles.py中的方法是可用的
                # 这里假设updatefiles.py用了类似的方式但实现正确
                raise HTTPException(status_code=500, 
                    detail="创建请求失败，请检查lark_oapi版本，以及查看updatefiles.py中的实现")
        
        response = self.client.bitable.v1.app_table_record.create(request)
        if not response.success():
            error_msg = f"Failed to submit paper: {response.msg}"
            print(f"API Error: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

        return response.data.record.record_id

    async def get_submission_history(self) -> List[PaperSubmission]:
        request = lark.bitable.v1.ListAppTableRecordRequest.builder()\
            .app_token(self.app_token)\
            .table_id(self.table_id)\
            .page_size(200)\
            .build()
        
        try:
            response = self.client.bitable.v1.app_table_record.list(request)
            if not response.success():
                error_msg = f"Failed to fetch submission history: {response.msg}"
                print(f"API Error: {error_msg}")
                raise HTTPException(status_code=500, detail=error_msg)

            submissions = []
            for item in response.data.items:
                try:
                    # 参考query_table.py中的处理方式，确保所有值都不为None
                    fields = item.fields if item.fields else {}
                    
                    # 确保所有必填字段都有值
                    title = fields.get("论文标题") or "处理中"
                    # 如果标题包含"无标题信息可提取"或"无明确标题信息"，则显示为"处理中"
                    if title and ("无标题信息可提取" in title or "无明确标题信息" in title):
                        title = "处理中"
                    
                    submission = PaperSubmission(
                        id=item.record_id,
                        username=fields.get("username") or "anonymous",  # 添加用户名字段
                        论文标题=title,
                        文档核心内容=fields.get("文档核心内容") or "",
                        论文目录=fields.get("论文目录") or "",
                        论文研究方法修改意见=fields.get("论文研究方法修改意见") or "",
                        论文研究方法得分=fields.get("论文研究方法得分") or "",
                        论文结构修改意见=fields.get("论文结构修改意见") or "",
                        论文结构得分=fields.get("论文结构得分") or "",
                        论文结论=fields.get("论文结论") or "",
                        论文论证逻辑修改意见=fields.get("论文论证逻辑修改意见") or "",
                        论文论证逻辑得分=fields.get("论文论证逻辑得分") or "",
                        论文采用论证方法=fields.get("论文采用论证方法") or "",
                        附件上传=[
                            {
                                "name": file.get("name", "") or "",
                                "url": file.get('url', '') or file.get('file_token', '') or ""
                            }
                            for file in fields.get("附件上传", []) if file
                        ] if fields.get("附件上传") else [],
                        附件内容摘要=fields.get("附件内容摘要") or "",
                        论文论证逻辑完整分析=fields.get("论文论证逻辑完整分析") or "",
                        论文结构完整分析=fields.get("论文结构完整分析") or "",
                        论文研究方法完整分析=fields.get("论文研究方法完整分析") or ""
                    )
                    submissions.append(submission)
                except Exception as item_error:
                    print(f"处理一条记录时出错，跳过: {str(item_error)}")
                    # 如果单个记录出错，继续处理其他记录
                    continue
                    
            return submissions

        except Exception as e:
            error_msg = f"Failed to fetch submission history: {str(e)}"
            print(f"Exception: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

    async def get_submission_result(self, record_id: str) -> Optional[PaperSubmission]:
        request = lark.bitable.v1.GetAppTableRecordRequest.builder()\
            .app_token(self.app_token)\
            .table_id(self.table_id)\
            .record_id(record_id)\
            .build()
        
        response = self.client.bitable.v1.app_table_record.get(request)
        if not response.success():
            raise HTTPException(status_code=404, detail="Submission not found")

        record = response.data.record
        fields = record.fields if record.fields else {}
        
        title = fields.get("论文标题") or "无标题"
        # 如果标题包含"无标题信息可提取"或"无明确标题信息"，则显示为"处理中"
        if title and ("无标题信息可提取" in title or "无明确标题信息" in title):
            title = "处理中"
        
        return PaperSubmission(
            id=record.record_id,
            username=fields.get("username") or "anonymous",  # 添加用户名字段
            论文标题=title,
            文档核心内容=fields.get("文档核心内容") or "",
            论文目录=fields.get("论文目录") or "",
            论文研究方法修改意见=fields.get("论文研究方法修改意见") or "",
            论文研究方法得分=fields.get("论文研究方法得分") or "",
            论文结构修改意见=fields.get("论文结构修改意见") or "",
            论文结构得分=fields.get("论文结构得分") or "",
            论文结论=fields.get("论文结论") or "",
            论文论证逻辑修改意见=fields.get("论文论证逻辑修改意见") or "",
            论文论证逻辑得分=fields.get("论文论证逻辑得分") or "",
            论文采用论证方法=fields.get("论文采用论证方法") or "",
            附件上传=[
                {
                    "name": file.get("name", "") or "",
                    "url": file.get('url', '') or file.get('file_token', '') or ""
                }
                for file in fields.get("附件上传", []) if file
            ] if fields.get("附件上传") else [],
            附件内容摘要=fields.get("附件内容摘要") or "",
            论文论证逻辑完整分析=fields.get("论文论证逻辑完整分析") or "",
            论文结构完整分析=fields.get("论文结构完整分析") or "",
            论文研究方法完整分析=fields.get("论文研究方法完整分析") or ""
        )

feishu_service = FeishuService()

@app.get("/api/submissions")
async def get_submissions(
    page: int = 1, 
    page_size: int = 8,
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # 获取所有提交记录
        all_submissions = await feishu_service.get_submission_history()
        
        # 根据当前用户筛选记录
        if current_user and current_user.username:
            # 仅显示当前登录用户的记录
            username = current_user.username
            print(f"当前用户: {username}，筛选相关论文")
            
            filtered_submissions = [
                sub for sub in all_submissions 
                if sub.username == username or sub.username == "anonymous"
            ]
            
            print(f"筛选后记录数: {len(filtered_submissions)}/{len(all_submissions)}")
        else:
            # 未登录用户只能看到匿名记录
            print("未登录用户，只显示匿名记录")
            filtered_submissions = [
                sub for sub in all_submissions 
                if not sub.username or sub.username == "anonymous"
            ]
        
        # 按ID倒序排列（假设ID越大表示越新的提交）
        filtered_submissions.sort(key=lambda x: x.id, reverse=True)
        
        # 计算分页信息
        total = len(filtered_submissions)
        total_pages = (total + page_size - 1) // page_size
        
        # 获取当前页的数据
        start = (page - 1) * page_size
        end = min(start + page_size, total)
        current_page_data = filtered_submissions[start:end]
        
        # 返回带有分页信息的响应
        return {
            "data": current_page_data,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submissions")
async def submit_paper(
    request: SubmitPaperRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # 获取当前用户名
        username = current_user.username if current_user else "anonymous"
        
        # 添加调试日志
        print(f"用户 {username} 正在提交论文")
        
        # 传递用户名给提交函数
        record_id = await feishu_service.submit_paper(request.content, username=username)
        return {"data": {"recordId": record_id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions/{record_id}")
async def get_submission(record_id: str):
    """获取论文详情的端点"""
    try:
        print(f"正在从飞书服务获取记录: {record_id}")
        submission = await feishu_service.get_submission_result(record_id)
        
        if submission is None:
            print(f"未找到记录ID: {record_id}")
            raise HTTPException(status_code=404, detail=f"找不到ID为 {record_id} 的论文")
        
        print(f"成功获取记录: {submission.id}, 标题: {submission.论文标题}")
        return submission
    except Exception as e:
        print(f"获取论文时出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(
    file: UploadFile,
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        # 文件上传部分保持不变
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # 使用飞书API上传文件
        result = await feishu_service.upload_file(temp_file_path)
        print(f"文件上传成功，结果：{result}")
        
        # 删除临时文件
        os.unlink(temp_file_path)
        
        # 记录状态
        file_upload_success = True
        record_created_success = False
        record_id = None
        error_msg = ""
        
        # 获取当前用户名
        username = current_user.username if current_user else "anonymous"
        
        # 修正创建记录的代码
        try:
            # 准备字段数据
            fields = {
                "论文标题": "处理中",
                "文档核心内容": "通过网站上传的文件，待处理",
                "username": username,  # 添加用户名字段
                "附件上传": [
                    {
                        "name": file.filename,
                        "type": "file", 
                        "file_token": result["file_token"]
                    }
                ]
            }
            
            print(f"准备创建记录，字段内容: {fields}")
            
            # 尝试方法1: 直接使用字典作为请求体
            try:
                request = lark.bitable.v1.CreateAppTableRecordRequest.builder() \
                    .app_token(feishu_service.app_token) \
                    .table_id(feishu_service.table_id) \
                    .request_body({"fields": fields}) \
                    .build()
                
                print(f"创建请求: {request}")
                
                response = feishu_service.client.bitable.v1.app_table_record.create(request)
                print(f"创建响应: 成功={response.success()}, 消息={response.msg}")
                
                if response.success():
                    record_id = response.data.record.record_id
                    record_created_success = True
                    print(f"记录创建成功，ID: {record_id}")
                    result["record_id"] = record_id
                else:
                    error_msg = f"记录创建失败，错误: {response.msg}"
                    print(error_msg)
                    # 如果方法1失败，尝试方法2
                    if "Invalid request body" in response.msg:
                        raise Exception("尝试使用备用方法")
            except Exception as e1:
                print(f"方法1创建记录失败，尝试方法2: {str(e1)}")
                
                # 方法2: 使用官方SDK文档推荐的结构
                from lark_oapi.api.bitable.v1.model.create_app_table_record_request_body import CreateAppTableRecordRequestBody
                
                body = CreateAppTableRecordRequestBody()
                body.fields = fields
                
                request = lark.bitable.v1.CreateAppTableRecordRequest.builder() \
                    .app_token(feishu_service.app_token) \
                    .table_id(feishu_service.table_id) \
                    .request_body(body) \
                    .build()
                
                print(f"创建请求(方法2): {request}")
                
                response = feishu_service.client.bitable.v1.app_table_record.create(request)
                print(f"创建响应(方法2): 成功={response.success()}, 消息={response.msg}")
                
                if response.success():
                    record_id = response.data.record.record_id
                    record_created_success = True
                    print(f"记录创建成功(方法2)，ID: {record_id}")
                    result["record_id"] = record_id
                else:
                    error_msg = f"记录创建失败(方法2)，错误: {response.msg}"
                    print(error_msg)    
        except Exception as e:
            import traceback
            error_msg = f"创建记录异常: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
        
        # 明确返回状态，确保前端能够正确处理
        response_data = {
            "success": file_upload_success,
            "record_created": record_created_success,
            "record_id": record_id,
            "message": "文件上传成功" + (", 且记录已创建。论文正在进行评审，预计时间为1-2分钟，请在论文列表中查看详细结论" if record_created_success else f", 但记录创建失败: {error_msg}"),
            "data": result   
        }
        
        print(f"返回给前端的数据: {response_data}")
        return response_data
    except Exception as e:
        # 其余错误处理部分保持不变
        import traceback
        print(f"文件上传失败: {str(e)}")
        print(f"异常详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file_alt(
    file: UploadFile,
    current_user: Optional[User] = Depends(get_current_user)
):
    # 直接复用 /api/upload 的处理函数
    return await upload_file(file)

# 添加CORS中间件，允许前端访问
# 删除下面这段代码，因为它是重复的
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # 开发环境允许所有来源，生产环境应该限制
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# 添加路由前缀
app.include_router(auth_router, prefix="/api/auth", tags=["认证"])
app.include_router(submission_router, prefix="/api", tags=["论文"])

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/api/debug/routes")
async def list_routes():
    """列出所有可用的API路由，仅用于开发调试"""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": route.methods if hasattr(route, "methods") else None,
        })
    return {
        "routes_count": len(routes),
        "routes": routes
    }

@app.get("/")
async def root():
    """根路由，返回API信息"""
    return {
        "message": "欢迎使用论文评分系统API",
        "documentation": "/docs",
        "status": "running"
    }

# 请求中间件，添加详细日志
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    # 记录请求详情
    print(f"收到请求: {request.method} {request.url.path}")
    if request.path_params:
        print(f"路径参数: {request.path_params}")
    
    # 处理请求
    response = await call_next(request)
    
    # 计算处理时间
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # 记录响应状态码
    print(f"响应状态: {response.status_code} 处理时间: {process_time:.4f}秒")
    return response

# 启动消息
@app.on_event("startup")
async def startup_event():
    print("="*50)
    print("论文评分系统API启动")
    print(f"文档地址: http://localhost:8000/docs")
    print(f"用户数据文件: {os.path.join(os.path.dirname(__file__), 'users.csv')}")
    print(f"论文数据目录: {os.path.join(os.path.dirname(__file__), 'data')}")
    print("="*50)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/api/debug-submissions/{record_id}")
async def debug_submission(record_id: str):
    """不需要认证的调试端点，用于验证论文访问"""
    try:
        print(f"调试端点访问论文，ID: {record_id}")
        submission = await feishu_service.get_submission_result(record_id)
        
        if submission:
            return {
                "success": True,
                "id": submission.id,
                "title": submission.论文标题 or "[无标题]",
                "status": "found"
            }
        else:
            return {
                "success": False,
                "id": record_id,
                "status": "not_found"
            }
    except Exception as e:
        return {
            "success": False,
            "id": record_id,
            "error": str(e),
            "status": "error"
        }

@app.get("/test-api", response_class=HTMLResponse)
async def test_api_page():
    """返回API测试页面"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>API测试页</title>
        <style>
            body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
            .btn { padding: 10px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
        </style>
    </head>
    <body>
        <h1>论文系统API测试</h1>
        
        <div>
            <h3>测试论文API</h3>
            <button class="btn" onclick="testApi('/api/health')">健康检查</button>
            <button class="btn" onclick="testApi('/api/submissions')">获取所有论文</button>
            <button class="btn" onclick="testApi('/api/submissions/receDrtyx8')">获取论文1</button>
            <button class="btn" onclick="testApi('/api/debug-submissions/receDrtyx8')">调试论文1</button>
        </div>
        
        <div id="result" style="margin-top: 20px;">
            <p>点击按钮测试API...</p>
        </div>
        
        <script>
            async function testApi(endpoint) {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = `<p>测试: ${endpoint}...</p>`;
                
                try {
                    const response = await fetch(`http://localhost:8000${endpoint}`);
                    const statusText = response.ok ? '成功' : '失败';
                    resultDiv.innerHTML += `<p>状态: ${response.status} ${statusText}</p>`;
                    
                    if (response.headers.get('content-type').includes('application/json')) {
                        const data = await response.json();
                        resultDiv.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                    } else {
                        const text = await response.text();
                        resultDiv.innerHTML += `<p>非JSON响应</p>`;
                        resultDiv.innerHTML += `<pre>${text.substring(0, 500)}...</pre>`;
                    }
                } catch (error) {
                    resultDiv.innerHTML += `<p>错误: ${error.message}</p>`;
                }
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# 添加直接打印论文数据的调试端点
@app.get("/api/print-submission/{record_id}")
async def print_submission_debug(record_id: str):
    """直接打印论文数据到终端，方便调试"""
    try:
        print("\n" + "="*80)
        print(f"调试输出论文 ID={record_id}")
        
        # 获取论文数据
        submission = await feishu_service.get_submission_result(record_id)
        
        if submission:
            # 打印到终端
            print("论文数据获取成功:")
            print(f"ID: {submission.id}")
            print(f"标题: {submission.论文标题}")
            print(f"内容前100字: {submission.文档核心内容[:100]}...")
            print("完整数据:")
            
            # 修复序列化方式 - 使用兼容新旧版本Pydantic的方法
            try:
                # Pydantic v2 方式
                if hasattr(submission, "model_dump_json"):
                    json_data = submission.model_dump_json(indent=2)
                    print(json_data)
                # Pydantic v1 方式
                else:
                    # 使用dict()然后用标准json模块
                    import json
                    print(json.dumps(submission.dict(), indent=2, ensure_ascii=False))
            except Exception as e:
                print(f"序列化数据失败: {e}")
                # 最简单的后备方案 - 直接打印对象属性
                for key, value in submission.__dict__.items():
                    print(f"{key}: {value}")
            
            # 返回简化数据
            return {
                "success": True,
                "message": "论文数据已打印到终端，请查看服务器日志",
                "data": {
                    "id": submission.id,
                    "title": submission.论文标题
                }
            }
        else:
            print(f"论文未找到: {record_id}")
            return {"success": False, "message": f"论文ID={record_id}未找到"}
    except Exception as e:
        error_msg = f"获取论文发生错误: {str(e)}"
        print(error_msg)
        import traceback
        print(traceback.format_exc())
        return {"success": False, "error": error_msg}