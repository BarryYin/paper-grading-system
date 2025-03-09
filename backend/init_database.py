"""
用户数据库初始化和修复工具
用于确保users.csv文件格式正确并包含所需的测试用户
"""

import os
import csv
import hashlib
from datetime import datetime
import uuid

# 文件路径设置
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.csv')

def generate_password_hash(password):
    """生成简单密码哈希（SHA-256）"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_users_csv():
    """初始化用户CSV文件"""
    # 确保目录存在
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    # 定义测试用户
    test_users = [
        {
            'user_id': 'test-id-123',
            'username': 'test',
            'password': 'test',
            'email': 'test@example.com',
        },
        {
            'user_id': 'admin-id-456',
            'username': 'admin',
            'password': 'admin',
            'email': 'admin@example.com',
        }
    ]
    
    # 检查文件是否存在
    file_exists = os.path.exists(USERS_FILE)
    
    # 如果文件存在，读取现有用户
    existing_users = {}
    if file_exists:
        try:
            with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if 'username' in row and 'user_id' in row:
                        existing_users[row['username'].lower()] = row
        except Exception as e:
            print(f"读取现有用户文件失败: {e}")
            file_exists = False  # 如果读取失败，当作文件不存在处理
    
    # 如果文件不存在或需要创建新文件
    if not file_exists:
        # 创建新文件
        with open(USERS_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['user_id', 'username', 'password_hash', 'email', 'created_at'])
        print(f"创建了新的用户文件: {USERS_FILE}")
    
    # 添加测试用户（如果不存在）
    users_added = False
    for user in test_users:
        if user['username'].lower() not in existing_users:
            user_id = user['user_id']
            username = user['username']
            password_hash = generate_password_hash(user['password'])
            email = user['email']
            created_at = datetime.now().isoformat()
            
            with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([user_id, username, password_hash, email, created_at])
            
            print(f"添加了测试用户: {username}")
            users_added = True
    
    return users_added

def validate_and_repair_csv():
    """验证并尝试修复CSV文件格式"""
    try:
        valid_rows = []
        header = None
        
        # 读取文件
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            
            # 检查标题行
            required_fields = ['user_id', 'username', 'password_hash', 'email', 'created_at']
            if not header or not all(field in header for field in required_fields):
                print("CSV文件标题行无效，将创建新文件")
                header = required_fields
            else:
                # 读取和验证所有数据行
                for row in reader:
                    if len(row) == len(header):
                        valid_rows.append(row)
                    else:
                        print(f"跳过无效行: {row}")
        
        # 写入修复后的文件
        with open(USERS_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(valid_rows)
        
        print(f"验证并修复了CSV文件，保留了{len(valid_rows)}行有效数据")
        return True
    except Exception as e:
        print(f"验证CSV文件时出错: {e}")
        return False

if __name__ == "__main__":
    print("开始初始化用户数据库...")
    
    # 验证和修复CSV文件
    if os.path.exists(USERS_FILE):
        print(f"现有用户文件: {USERS_FILE}")
        validate_and_repair_csv()
    
    # 初始化测试用户
    users_added = init_users_csv()
    
    if users_added:
        print("初始化完成: 添加了新的测试用户")
    else:
        print("初始化完成: 所有测试用户已存在")
    
    print(f"用户数据文件位置: {USERS_FILE}")
    print("你可以使用以下任意测试账户登录系统:")
    print("  - 用户名: test, 密码: test")
    print("  - 用户名: admin, 密码: admin")
