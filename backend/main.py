from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import lark_oapi as lark
from typing import List, Optional

app = FastAPI()

from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义数据模型
class PaperSubmission(BaseModel):
    id: str
    论文标题: str
    文档核心内容: str
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

        request = lark.bitable.v1.CreateAppTableRecordRequest.builder()\
            .app_token(self.app_token)\
            .table_id(self.table_id)\
            .request_body(lark.bitable.v1.CreateAppTableRecordRequestBody(
                fields=fields
            ))\
            .build()
        
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
                submission = PaperSubmission(
                    id=item.record_id,
                    论文标题=item.fields.get("论文标题", "无标题"),
                    文档核心内容=item.fields.get("文档核心内容", ""),
                    论文目录=item.fields.get("论文目录", ""),
                    论文研究方法修改意见=item.fields.get("论文研究方法修改意见", ""),
                    论文研究方法得分=item.fields.get("论文研究方法得分", ""),
                    论文结构修改意见=item.fields.get("论文结构修改意见", ""),
                    论文结构得分=item.fields.get("论文结构得分", ""),
                    论文结论=item.fields.get("论文结论", ""),
                    论文论证逻辑修改意见=item.fields.get("论文论证逻辑修改意见", ""),
                    论文论证逻辑得分=item.fields.get("论文论证逻辑得分", ""),
                    论文采用论证方法=item.fields.get("论文采用论证方法", ""),
                    附件上传=[
                        {
                            "name": file.get("name", ""),
                            "url": file.get('url', '')
                        }
                        for file in item.fields.get("附件上传", [])
                    ],
                    附件内容摘要=item.fields.get("附件内容摘要", ""),
                    论文论证逻辑完整分析=item.fields.get("论文论证逻辑完整分析", ""),
                    论文结构完整分析=item.fields.get("论文结构完整分析", ""),
                    论文研究方法完整分析=item.fields.get("论文研究方法完整分析", "")
                )
                submissions.append(submission)
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
        return PaperSubmission(
            id=record.record_id,
            论文标题=record.fields.get("论文标题", "无标题"),
            文档核心内容=record.fields.get("文档核心内容", ""),
            论文目录=record.fields.get("论文目录"),
            论文研究方法修改意见=record.fields.get("论文研究方法修改意见"),
            论文研究方法得分=record.fields.get("论文研究方法得分"),
            论文结构修改意见=record.fields.get("论文结构修改意见"),
            论文结构得分=record.fields.get("论文结构得分"),
            论文结论=record.fields.get("论文结论"),
            论文论证逻辑修改意见=record.fields.get("论文论证逻辑修改意见"),
            论文论证逻辑得分=record.fields.get("论文论证逻辑得分"),
            论文采用论证方法=record.fields.get("论文采用论证方法"),
            附件上传=[
                {
                    "name": file.get("name", ""),
                    "url": file.get('url', '')
                }
                for file in record.fields.get("附件上传", [])
            ],
            附件内容摘要=record.fields.get("附件内容摘要"),
            论文论证逻辑完整分析=record.fields.get("论文论证逻辑完整分析"),
            论文结构完整分析=record.fields.get("论文结构完整分析"),
            论文研究方法完整分析=record.fields.get("论文研究方法完整分析")
        )

feishu_service = FeishuService()

@app.get("/api/submissions")
async def get_submissions():
    try:
        submissions = await feishu_service.get_submission_history()
        return {"data": submissions}
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)