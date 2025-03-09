"""
用于调试系统状态的工具
"""
import csv
import os
import json

def list_all_users():
    """列出所有用户数据"""
    print("\n=== 用户数据 ===")
    
    # 检查CSV文件中的用户
    users_file = os.path.join(os.path.dirname(__file__), 'users.csv')
    print(f"\n读取用户文件: {users_file}")
    
    if not os.path.exists(users_file):
        print("用户文件不存在!")
        return
    
    try:
        with open(users_file, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            print(" | ".join(header))
            print("-" * 80)
            count = 0
            for row in reader:
                print(" | ".join(row))
                count += 1
            print(f"\n总计 {count} 个用户")
    except Exception as e:
        print(f"读取CSV文件出错: {e}")

def check_auth_system():
    """检查认证系统状态"""
    print("\n=== 认证系统状态 ===")
    
    # 检查会话文件
    sessions_file = os.path.join(os.path.dirname(__file__), 'sessions.json')
    print(f"\n会话文件: {sessions_file}")
    
    if os.path.exists(sessions_file):
        try:
            with open(sessions_file, 'r') as f:
                sessions = json.load(f)
                print(f"当前有 {len(sessions)} 个活跃会话")
                for sid, session in sessions.items():
                    print(f" - {session.get('username', 'unknown')} (过期时间: {session.get('expires', 'unknown')})")
        except Exception as e:
            print(f"读取会话文件出错: {e}")
    else:
        print("会话文件不存在!")

if __name__ == "__main__":
    print("运行认证系统诊断...")
    list_all_users()
    check_auth_system()
