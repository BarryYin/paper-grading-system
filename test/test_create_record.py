import sys
import os
import json

# Add project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import lark_oapi as lark

def main():
    print('开始测试创建多维表格记录...')
    
    # 创建client
    client = lark.Client.builder() \
        .app_id("cli_a7dad3e298b8500e") \
        .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp") \
        .enable_set_token(True) \
        .log_level(lark.LogLevel.DEBUG) \
        .build()

    # 测试方法1：使用AppTableRecord.builder()方式
    try:
        print("\n测试方法1: 使用AppTableRecord.builder()")
        request1 = lark.bitable.v1.CreateAppTableRecordRequest.builder() \
            .app_token("EizAbvZvxaTrKlsiumGcXLBuneb") \
            .table_id("tblIlSF9KydXg612") \
            .request_body(lark.api.bitable.v1.model.AppTableRecord.builder()
                .fields({
                    "论文标题": "测试记录1 - 使用AppTableRecord.builder()",
                    "文档核心内容": "这是一个测试记录"
                })
                .build()) \
            .build()
        
        response1 = client.bitable.v1.app_table_record.create(request1)
        if response1.success():
            print(f"方法1成功! 记录ID: {response1.data.record.record_id}")
        else:
            print(f"方法1失败: {response1.msg}")
    except Exception as e:
        print(f"方法1异常: {str(e)}")
    
    # 测试方法2：直接使用字典方式
    try:
        print("\n测试方法2: 直接使用字典")
        request2 = lark.bitable.v1.CreateAppTableRecordRequest.builder() \
            .app_token("EizAbvZvxaTrKlsiumGcXLBuneb") \
            .table_id("tblIlSF9KydXg612") \
            .request_body({
                "fields": {
                    "论文标题": "测试记录2 - 使用字典方式",
                    "文档核心内容": "这是另一个测试记录"
                }
            }) \
            .build()
        
        response2 = client.bitable.v1.app_table_record.create(request2)
        if response2.success():
            print(f"方法2成功! 记录ID: {response2.data.record.record_id}")
        else:
            print(f"方法2失败: {response2.msg}")
    except Exception as e:
        print(f"方法2异常: {str(e)}")
        
    print("\n测试完成!")

if __name__ == '__main__':
    main()
