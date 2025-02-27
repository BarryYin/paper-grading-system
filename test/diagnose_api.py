import os
import json
import requests
import sys

# 将项目根目录添加到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import lark_oapi as lark
from lark_oapi.api.bitable.v1 import *
from lark_oapi.api.bitable.v1.model import *

def test_backend_api():
    """测试后端API"""
    print("\n=== 测试后端API ===")
    
    # 1. 测试/api/submissions端点
    try:
        print("\n1. 测试GET /api/submissions")
        response = requests.get("http://localhost:8000/api/submissions")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功获取提交列表，共{len(data.get('data', []))}条记录")
        else:
            print(f"❌ 获取提交列表失败: {response.status_code}")
            print(f"   错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 请求/api/submissions异常: {str(e)}")
    
    # 2. 测试上传文件并创建记录
    try:
        print("\n2. 测试POST /api/upload")
        test_file_path = input("请输入要上传的测试文件路径: ")
        if not os.path.exists(test_file_path):
            print(f"❌ 测试文件不存在: {test_file_path}")
            return
        
        with open(test_file_path, 'rb') as f:
            file_content = f.read()
            
        files = {'file': (os.path.basename(test_file_path), file_content)}
        upload_response = requests.post("http://localhost:8000/api/upload", files=files)
        
        print(f"上传响应状态码: {upload_response.status_code}")
        if upload_response.status_code == 200:
            result = upload_response.json()
            print(f"上传响应内容: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            if result.get('success'):
                print("✅ 文件上传成功")
                
                if result.get('record_created') and result.get('record_id'):
                    record_id = result.get('record_id')
                    print(f"✅ 记录创建成功! ID: {record_id}")
                    
                    # 测试获取该记录
                    try:
                        record_response = requests.get(f"http://localhost:8000/api/submissions/{record_id}")
                        if record_response.status_code == 200:
                            record = record_response.json()
                            print(f"✅ 成功获取记录详情:")
                            print(f"  标题: {record.get('论文标题')}")
                            print(f"  附件数: {len(record.get('附件上传', []))}")
                        else:
                            print(f"❌ 获取记录详情失败: {record_response.status_code}")
                    except Exception as e:
                        print(f"❌ 获取记录详情异常: {str(e)}")
                else:
                    print(f"❌ 记录创建失败: {result.get('message')}")
            else:
                print(f"❌ 文件上传失败: {result.get('message')}")
        else:
            print(f"❌ 上传请求失败: {upload_response.text}")
    except Exception as e:
        print(f"❌ 测试上传异常: {str(e)}")

def test_direct_feishu_api():
    """直接测试飞书API"""
    print("\n=== 直接测试飞书API ===")
    
    # 创建client
    client = lark.Client.builder() \
        .app_id("cli_a7dad3e298b8500e") \
        .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp") \
        .enable_set_token(True) \
        .log_level(lark.LogLevel.DEBUG) \
        .build()
    
    # 测试获取表格记录
    try:
        print("\n1. 测试获取表格记录")
        request = ListAppTableRecordRequest.builder() \
            .app_token("EizAbvZvxaTrKlsiumGcXLBuneb") \
            .table_id("tblIlSF9KydXg612") \
            .page_size(1) \
            .build()
        
        response = client.bitable.v1.app_table_record.list(request)
        
        if response.success():
            print(f"✅ 成功获取记录，总数: {response.data.total}")
            if response.data.items:
                item = response.data.items[0]
                print(f"  首条记录ID: {item.record_id}")
                print(f"  标题: {item.fields.get('论文标题', '无标题')}")
        else:
            print(f"❌ 获取记录失败: {response.msg}")
    except Exception as e:
        print(f"❌ 获取记录异常: {str(e)}")

def compare_db_entries():
    """比较多维表格记录"""
    print("\n=== 比较多维表格记录 ===")
    
    # 从后端获取记录
    try:
        print("1. 从后端API获取记录列表")
        backend_response = requests.get("http://localhost:8000/api/submissions")
        if backend_response.status_code == 200:
            backend_data = backend_response.json().get('data', [])
            print(f"✅ 从后端获取到{len(backend_data)}条记录")
        else:
            print(f"❌ 从后端获取记录失败: {backend_response.status_code}")
            backend_data = []
    except Exception as e:
        print(f"❌ 从后端获取记录异常: {str(e)}")
        backend_data = []
    
    # 直接从飞书获取记录
    try:
        print("\n2. 直接从飞书获取记录")
        client = lark.Client.builder() \
            .app_id("cli_a7dad3e298b8500e") \
            .app_secret("UfFx9CqEhqP06qwGFetqzezliNeDO2Hp") \
            .enable_set_token(True) \
            .build()
        
        request = ListAppTableRecordRequest.builder() \
            .app_token("EizAbvZvxaTrKlsiumGcXLBuneb") \
            .table_id("tblIlSF9KydXg612") \
            .page_size(20) \
            .build()
        
        response = client.bitable.v1.app_table_record.list(request)
        
        if response.success():
            feishu_data = response.data.items
            print(f"✅ 直接从飞书获取到{len(feishu_data)}条记录")
            
            # 比较记录数量
            if len(backend_data) == response.data.total:
                print("✅ 后端和飞书的记录数量一致")
            else:
                print(f"❌ 记录数量不一致: 后端{len(backend_data)}条，飞书{response.data.total}条")
                
            # 取出几条记录检查ID是否一致
            if feishu_data and backend_data:
                print("\n3. 检查记录ID是否一致:")
                for i in range(min(3, len(feishu_data), len(backend_data))):
                    feishu_id = feishu_data[i].record_id
                    backend_id = backend_data[i]['id']
                    if feishu_id == backend_id:
                        print(f"  ✅ 记录{i+1}ID一致: {feishu_id}")
                    else:
                        print(f"  ❌ 记录{i+1}ID不一致: 飞书={feishu_id}, 后端={backend_id}")
        else:
            print(f"❌ 直接从飞书获取记录失败: {response.msg}")
    except Exception as e:
        print(f"❌ 直接从飞书获取记录异常: {str(e)}")

def main():
    print("API诊断工具")
    print("===========")
    
    print("\n选择要运行的测试:")
    print("1. 测试后端API")
    print("2. 直接测试飞书API")
    print("3. 比较多维表格记录")
    print("4. 运行全部测试")
    
    choice = input("\n请输入选项(1-4): ")
    
    if choice == '1':
        test_backend_api()
    elif choice == '2':
        test_direct_feishu_api()
    elif choice == '3':
        compare_db_entries()
    elif choice == '4':
        test_backend_api()
        test_direct_feishu_api()
        compare_db_entries()
    else:
        print("无效的选项")

if __name__ == "__main__":
    main()
