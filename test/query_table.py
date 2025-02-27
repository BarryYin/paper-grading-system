import json
import sys
import os

# Add project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import lark_oapi as lark
from lark_oapi.api.bitable.v1 import *
from backend.main import PaperSubmission

def main():
    # 创建client
    client = lark.Client.builder()\
        .app_id("cli_a7dad3e298b8500e")\
        .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp")\
        .enable_set_token(True)\
        .log_level(lark.LogLevel.DEBUG)\
        .build()

    # 构造请求对象
    request = ListAppTableRecordRequest.builder()\
        .app_token("EizAbvZvxaTrKlsiumGcXLBuneb")\
        .table_id("tblIlSF9KydXg612")\
        .page_size(20)\
        .build()
    
    # 发起请求
    response = client.bitable.v1.app_table_record.list(request)

    # 处理失败返回
    if not response.success():
        lark.logger.error(
            f"获取记录失败，错误码: {response.code}, 错误信息: {response.msg}, log_id: {response.get_log_id()}")
        return

    # 处理业务结果
    submissions = []
    if response.data and response.data.items:
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
                附件上传=item.fields.get("附件上传", []),
                附件内容摘要=item.fields.get("附件内容摘要", ""),
                论文论证逻辑完整分析=item.fields.get("论文论证逻辑完整分析", ""),
                论文结构完整分析=item.fields.get("论文结构完整分析", ""),
                论文研究方法完整分析=item.fields.get("论文研究方法完整分析", "")
            )
            submissions.append(submission)
            print(f"\n记录 {submission.id}:")
            print(f"论文标题: {submission.论文标题}")
            print(f"文档核心内容: {submission.文档核心内容}")
            if submission.论文目录:
                print(f"论文目录: {submission.论文目录}")

    print(f"\n共获取到 {len(submissions)} 条记录")

if __name__ == "__main__":
    main()