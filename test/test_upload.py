import sys
import os

# Add project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
from backend.main import FeishuService

@pytest.fixture
def feishu_service():
    return FeishuService()

@pytest.fixture
def test_file():
    test_file_path = 'test_document.txt'
    test_content = '这是一个测试文档内容'
    
    # 创建测试文件
    with open(test_file_path, 'w', encoding='utf-8') as f:
        f.write(test_content)
    
    yield test_file_path
    
    # 清理测试文件
    if os.path.exists(test_file_path):
        os.remove(test_file_path)

@pytest.mark.asyncio
async def test_upload_file_content(feishu_service, test_file):
    """测试上传文件内容到多维表格"""
    print('\n执行测试：上传文件内容')
    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f'准备上传的文件内容：{content}')
    
    try:
        print('开始上传文件内容到多维表格...')
        record_id = await feishu_service.submit_paper(content)
        print(f'文件上传成功，记录ID：{record_id}')
        assert record_id is not None
        
        # 验证上传结果
        print('开始验证上传结果...')
        result = await feishu_service.get_submission_result(record_id)
        print(f'获取到的提交结果：{result}')
        assert result is not None
        assert result.文档核心内容 == content
        print('验证成功：上传的内容与原始内容匹配')
    except Exception as e:
        print(f'上传测试失败，错误信息：{str(e)}')
        pytest.fail(f'上传测试失败: {str(e)}')

@pytest.mark.asyncio
async def test_upload_empty_content(feishu_service):
    """测试上传空文件内容"""
    try:
        record_id = await feishu_service.submit_paper('')
        assert record_id is not None
        
        result = await feishu_service.get_submission_result(record_id)
        assert result is not None
        assert result.文档核心内容 == ''
    except Exception as e:
        pytest.fail(f'空文件测试失败: {str(e)}')

@pytest.mark.asyncio
async def test_upload_special_characters(feishu_service):
    """测试上传包含特殊字符的内容"""
    special_content = '特殊字符测试：!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    try:
        record_id = await feishu_service.submit_paper(special_content)
        assert record_id is not None
        
        result = await feishu_service.get_submission_result(record_id)
        assert result is not None
        assert result.文档核心内容 == special_content
    except Exception as e:
        pytest.fail(f'特殊字符测试失败: {str(e)}')

if __name__ == '__main__':
    # 运行所有测试函数
    asyncio.run(test_upload_file_content(FeishuService(), 'test_document.txt'))
    asyncio.run(test_upload_empty_content(FeishuService()))
    asyncio.run(test_upload_special_characters(FeishuService()))