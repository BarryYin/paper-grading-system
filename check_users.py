#!/usr/bin/env python3
"""
快速检查用户注册状态的脚本
"""
import os
import sys

# 添加项目目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入调试工具
try:
    from backend.debug_tools import list_all_users, check_auth_system
    
    print("=== 用户数据检查工具 ===")
    list_all_users()
    check_auth_system()
    
except Exception as e:
    print(f"运行检查时出错: {e}")
    import traceback
    traceback.print_exc()

input("\n按Enter键退出...")
