#!/usr/bin/env python3
import subprocess
import sys
import os
import platform

def print_colored(text, color):
    """打印彩色文本"""
    colors = {
        'green': '\033[92m',
        'yellow': '\033[93m',
        'red': '\033[91m',
        'blue': '\033[94m',
        'end': '\033[0m'
    }
    print(f"{colors.get(color, '')}{text}{colors['end']}")

def is_package_installed(package_name):
    """检查包是否已安装"""
    try:
        __import__(package_name.split('>=')[0].split('[')[0])
        return True
    except ImportError:
        return False

def install_requirements():
    """安装requirements.txt中的依赖项"""
    requirements_path = os.path.join(os.path.dirname(__file__), 'backend', 'requirements.txt')
    
    if not os.path.exists(requirements_path):
        print_colored(f"错误：找不到依赖文件 {requirements_path}", "red")
        return False
    
    print_colored("正在读取依赖项列表...", "blue")
    
    with open(requirements_path, 'r') as f:
        packages = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    print_colored(f"找到 {len(packages)} 个依赖项", "blue")
    
    # 检查哪些包需要安装
    packages_to_install = []
    for package in packages:
        package_name = package.split('>=')[0].split('[')[0]
        if not is_package_installed(package_name):
            packages_to_install.append(package)
            print_colored(f"需要安装: {package}", "yellow")
        else:
            print_colored(f"已安装: {package_name}", "green")
    
    if not packages_to_install:
        print_colored("所有依赖项已安装，无需更新", "green")
        return True
    
    print_colored("\n开始安装缺少的依赖项...", "blue")
    
    # 构建pip命令
    pip_command = [sys.executable, "-m", "pip", "install"]
    
    # 如果是Windows且非管理员，添加--user选项
    if platform.system() == "Windows" and not is_admin():
        pip_command.append("--user")
    
    # 添加所有需要安装的包
    pip_command.extend(packages_to_install)
    
    print_colored(f"执行: {' '.join(pip_command)}", "blue")
    
    try:
        subprocess.check_call(pip_command)
        print_colored("\n所有依赖项已成功安装!", "green")
        return True
    except subprocess.CalledProcessError as e:
        print_colored(f"\n安装依赖项时出错: {e}", "red")
        return False

def is_admin():
    """检查是否以管理员权限运行"""
    try:
        if platform.system() == "Windows":
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.geteuid() == 0
    except:
        return False

if __name__ == "__main__":
    print_colored("=== 论文评分系统依赖项安装工具 ===", "blue")
    success = install_requirements()
    
    if success:
        print_colored("\n您现在可以运行后端服务了:", "green")
        print_colored("python run_backend.py", "blue")
    else:
        print_colored("\n请手动安装缺少的依赖项:", "yellow")
        print_colored("pip install -r backend/requirements.txt", "blue")
    
    print_colored("\n按Enter键退出...", "blue")
    input()
