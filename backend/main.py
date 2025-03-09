from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import lark_oapi as lark
from typing import List, Optional
import os
import tempfile
# 修改相对导入为绝对导入
from auth import get_current_user, require_user, User
from auth_routes import router as auth_router

app = FastAPI()

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

# 定义数据模型
class PaperSubmission(BaseModel):
    id: str
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

    async def submit_paper(self, content: str, file_path: str = None) -> str:
        fields = {
            "文档核心内容": content,
            "论文标题": "待评分",
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
            .page_size(20)\
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
async def get_submissions(page: int = 1, page_size: int = 8):
    try:
        # 获取所有提交记录
        submissions = await feishu_service.get_submission_history()
        
        # 按ID倒序排列（假设ID越大表示越新的提交）
        submissions.sort(key=lambda x: x.id, reverse=True)
        
        # 计算分页信息
        total = len(submissions)
        total_pages = (total + page_size - 1) // page_size
        
        # 获取当前页的数据
        start = (page - 1) * page_size
        end = min(start + page_size, total)
        current_page_data = submissions[start:end]
        
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
async def submit_paper(request: SubmitPaperRequest):
    try:
        record_id = await feishu_service.submit_paper(request.content)
        return {"data": {"recordId": record_id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions/{record_id}")
async def get_submission(record_id: str):
    try:
        submission = await feishu_service.get_submission_result(record_id)
        if submission is None:
            raise HTTPException(status_code=404, detail="Submission not found")
        return submission
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 修改上传文件处理函数，添加创建多维表格记录的功能

@app.post("/api/upload")
async def upload_file(file: UploadFile):
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
        
        # 修正创建记录的代码
        try:
            # 准备字段数据
            fields = {
                "论文标题": "处理中",
                "文档核心内容": "通过网站上传的文件，待处理",
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

# 同样修改备用路由
@app.post("/upload")
async def upload_file_alt(file: UploadFile):
    # 直接复用 /api/upload 的处理函数
    return await upload_file(file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)