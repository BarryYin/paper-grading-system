import sys
import os
import json

# Add project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import lark_oapi as lark
from lark_oapi.api.drive.v1 import *
from lark_oapi.api.drive.v1.model import *
from lark_oapi.api.bitable.v1 import *
from lark_oapi.api.bitable.v1.model import *

def upload_file(client, file_path):
    # 读取文件
    file = open(file_path, "rb")
    
    # 构造文件上传请求
    request = UploadAllFileRequest.builder() \
        .request_body(UploadAllFileRequestBody.builder()
            .file_name(os.path.basename(file_path))
            .parent_type("bitable_file")
            .parent_node("EizAbvZvxaTrKlsiumGcXLBuneb")
            .size(str(os.path.getsize(file_path)))
            .file(file)
            .build()) \
        .build()
    
    # 发起请求
    response = client.drive.v1.file.upload_all(request)
    
    # 处理失败返回
    if not response.success():
        lark.logger.error(
            f"文件上传失败，错误码: {response.code}, 错误信息: {response.msg}, log_id: {response.get_log_id()}, resp: \n{json.dumps(json.loads(response.raw.content), indent=4, ensure_ascii=False)}")
        raise Exception(f"文件上传失败：{response.msg}")
    
    # 处理业务结果
    lark.logger.info(lark.JSON.marshal(response.data, indent=4))
    return response.data.file_token

def main():
    print('开始创建新记录...')
    
    # 创建client
    client = lark.Client.builder() \
        .app_id("cli_a7dad3e298b8500e") \
        .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp") \
        .enable_set_token(True) \
        .log_level(lark.LogLevel.DEBUG) \
        .build()

    # 构造请求对象
    request = CreateAppTableRecordRequest.builder() \
        .app_token("EizAbvZvxaTrKlsiumGcXLBuneb") \
        .table_id("tblIlSF9KydXg612") \
        .request_body(AppTableRecord.builder()
            .fields({
                # "文档核心内容": "这是一个通过Python API创建的新记录内容",
                # "论文标题": "测试标题"
                "附件上传": [{
                    "name": "沈lala开题目录.docx",
                    "type": "file",
                    "file_token": upload_file(client, "/Users/mac/Documents/GitHub/paper-grading-system/沈lala开题目录.docx")
                }]
            })
            .build()) \
        .build()

    # 发起请求
    response = client.bitable.v1.app_table_record.create(request)

    # 处理失败返回
    if not response.success():
        lark.logger.error(
            f"创建记录失败，错误码: {response.code}, 错误信息: {response.msg}, log_id: {response.get_log_id()}, resp: \n{json.dumps(json.loads(response.raw.content), indent=4, ensure_ascii=False)}")
        return

    # 处理业务结果
    lark.logger.info(lark.JSON.marshal(response.data, indent=4))

if __name__ == '__main__':
    main()