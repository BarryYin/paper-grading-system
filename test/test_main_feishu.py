import sys
import os

# Add project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import FeishuService

async def test_feishu_connection():
    print('开始测试飞书服务连接...')
    
    feishu_service = FeishuService()
    
    try:
        # 测试获取提交历史
        print('测试获取提交历史...')
        history = await feishu_service.get_submission_history()
        print('提交历史获取成功：', history)
        
        # 测试提交论文
        print('\n测试提交论文...')
        content = '这是一个测试提交的内容'
        record_id = await feishu_service.submit_paper(content)
        print('论文提交成功，记录ID：', record_id)
        
        # 测试获取提交结果
        print('\n测试获取提交结果...')
        result = await feishu_service.get_submission_result(record_id)
        print('提交结果获取成功：', result)
        
        print('\n所有测试完成！API 连接正常！')
    except Exception as e:
        print('测试过程中发生错误：', e)

# 运行测试
if __name__ == '__main__':
    import asyncio
    asyncio.run(test_feishu_connection())