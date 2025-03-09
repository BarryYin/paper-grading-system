#!/usr/bin/env python3
"""
修复认证问题的脚本
"""
import os
import sys
import csv
import json
import hashlib
from datetime import datetime

# 添加项目目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 定义文件路径
USERS_FILE = os.path.join(current_dir, 'backend', 'users.csv')
SESSIONS_FILE = os.path.join(current_dir, 'backend', 'sessions.json')

def hash_password(password):
    """使用简单的SHA-256哈希密码"""
    return hashlib.sha256(password.encode()).hexdigest()

def ensure_file_exists(filepath, initial_content=""):
    """确保文件存在，如果不存在则创建"""
    if not os.path.exists(filepath):
        print(f"创建文件: {filepath}")
        with open(filepath, 'w') as f:
            f.write(initial_content)
    else:
        print(f"文件已存在: {filepath}")

def ensure_users_csv():
    """确保users.csv文件存在，并包含测试用户"""
    ensure_file_exists(USERS_FILE)
    
    # 检查文件是否为空或只有标题行
    is_empty = True
    try:
        with open(USERS_FILE, 'r', newline='') as f:
            reader = csv.reader(f)
            row_count = sum(1 for row in reader)
            is_empty = row_count <= 1
    except:
        is_empty = True
    
    # 如果为空，添加标题行
    if is_empty:
        with open(USERS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['user_id', 'username', 'password_hash', 'email', 'created_at'])
            print("添加CSV标题行")
    
    # 添加测试用户
    test_users = [
        ('test-id-123', 'test', hash_password('test'), 'test@example.com', datetime.now().isoformat()),
        ('admin-id-456', 'admin', hash_password('admin'), 'admin@example.com', datetime.now().isoformat())
    ]
    
    # 检查用户是否已存在
    existing_usernames = set()
    try:
        with open(USERS_FILE, 'r', newline='') as f:
            reader = csv.reader(f)
            next(reader)  # 跳过标题行
            for row in reader:
                if len(row) >= 2:
                    existing_usernames.add(row[1])
    except Exception as e:
        print(f"读取CSV出错: {e}")
    
    # 添加不存在的测试用户
    with open(USERS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        for user_id, username, password_hash, email, created_at in test_users:
            if username not in existing_usernames:
                writer.writerow([user_id, username, password_hash, email, created_at])
                print(f"添加测试用户: {username}")

def ensure_sessions_json():
    """确保sessions.json文件存在并且是有效的JSON"""
    ensure_file_exists(SESSIONS_FILE, "{}")
    
    # 验证JSON格式
    try:
        with open(SESSIONS_FILE, 'r') as f:
            json.load(f)
        print("Sessions文件格式正确")
    except Exception as e:
        print(f"Sessions文件格式错误，重置为空对象: {e}")
        with open(SESSIONS_FILE, 'w') as f:
            f.write("{}")

def main():
    print("=== 认证系统修复 ===")
    
    # 确保用户文件存在并有测试用户
    ensure_users_csv()
    
    # 确保会话文件存在
    ensure_sessions_json()
    
    print("\n修复完成! 你可以使用以下测试账号:")
    print(" - 用户名: test, 密码: test")
    print(" - 用户名: admin, 密码: admin")
    
    print("\n请重新启动后端服务。")

if __name__ == "__main__":
    main()
