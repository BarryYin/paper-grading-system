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
    for item in response.data.items:
        submission = PaperSubmission(
            id=item.record_id,
            title=item.fields.get("title", "无标题"),
            content=item.fields.get("content", ""),
            status=item.fields.get("status", "pending"),
            result=item.fields.get("result"),
            created_at=item.fields.get("created_at", ""),
            attachment=item.fields.get("attachment", [])
        )
        submissions.append(submission)
        print(f"\n记录 {submission.id}:")
        print(f"标题: {submission.title}")
        print(f"状态: {submission.status}")
        print(f"创建时间: {submission.created_at}")
        if submission.result:
            print(f"评分结果: {submission.result}")

    print(f"\n共获取到 {len(submissions)} 条记录")

if __name__ == "__main__":
    main()