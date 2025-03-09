import requests
import json
import sys

def test_health():
    """测试健康状态端点"""
    try:
        response = requests.get('http://localhost:8000/api/health')
        print("健康状态API响应:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        return True
    except Exception as e:
        print(f"健康检查失败: {e}")
        return False

def test_submission(submission_id):
    """测试获取特定论文"""
    try:
        print(f"正在获取论文ID={submission_id}...")
        response = requests.get(f'http://localhost:8000/api/submissions/{submission_id}')
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            data = response.json()
            print("论文数据:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return True
        else:
            print(f"请求失败: {response.text}")
            return False
    except Exception as e:
        print(f"请求出错: {e}")
        return False

if __name__ == "__main__":
    print("API测试工具")
    
    # 测试健康状态
    if not test_health():
        print("API服务可能未运行")
        sys.exit(1)
    
    # 测试论文
    test_ids = ['receDrtyx8', 'recuEG6Z8QuOWy', 'recPFmvHG1']
    for test_id in test_ids:
        print("\n" + "="*50)
        test_submission(test_id)

    print("\n测试完成，请检查上面的输出结果")
