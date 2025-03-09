#!/usr/bin/env python3
"""
端口管理工具 - 查找并管理占用端口的进程
"""

import os
import sys
import subprocess
import argparse
import socket
from typing import List, Tuple, Optional

def is_port_in_use(port: int) -> bool:
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_process_using_port(port: int) -> List[Tuple[int, str]]:
    """查找使用特定端口的进程"""
    processes = []
    
    try:
        # 对不同的操作系统使用不同的命令
        if sys.platform.startswith('darwin'):  # macOS
            cmd = ['lsof', '-i', f':{port}']
            output = subprocess.check_output(cmd, text=True)
            for line in output.strip().split('\n')[1:]:  # 跳过标题行
                parts = line.split()
                if len(parts) >= 2:
                    pid = int(parts[1])
                    process = ' '.join(parts[8:]) if len(parts) > 8 else parts[0]
                    processes.append((pid, process))
        elif sys.platform.startswith('win'):  # Windows
            cmd = ['netstat', '-ano', '|', 'findstr', f':{port}']
            output = subprocess.check_output(' '.join(cmd), shell=True, text=True)
            for line in output.strip().split('\n'):
                if 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) > 4:
                        pid = int(parts[4])
                        processes.append((pid, f"Process ID: {pid}"))
        else:  # Linux 和其他系统
            cmd = ['fuser', f'{port}/tcp', '-v']
            try:
                output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
                for line in output.strip().split('\n'):
                    if 'java' in line or 'python' in line:  # 简单过滤可能相关的进程
                        parts = line.split()
                        pid = int(parts[0])
                        process = ' '.join(parts[1:]) if len(parts) > 1 else 'Unknown'
                        processes.append((pid, process))
            except subprocess.CalledProcessError:
                # fuser 可能返回非零值，如果没有找到进程
                pass
    except Exception as e:
        print(f"查找进程时出错: {e}")
    
    return processes

def kill_process(pid: int) -> bool:
    """终止指定PID的进程"""
    try:
        if sys.platform.startswith('win'):
            subprocess.check_call(['taskkill', '/F', '/PID', str(pid)])
        else:
            subprocess.check_call(['kill', '-9', str(pid)])
        return True
    except Exception as e:
        print(f"终止进程 {pid} 时出错: {e}")
        return False

def find_free_port(start_port: int = 8000, end_port: int = 9000) -> Optional[int]:
    """查找一个可用的端口"""
    for port in range(start_port, end_port):
        if not is_port_in_use(port):
            return port
    return None

def main():
    parser = argparse.ArgumentParser(description='端口管理工具')
    parser.add_argument('--port', type=int, default=8000, help='要检查的端口号 (默认: 8000)')
    parser.add_argument('--kill', action='store_true', help='终止使用该端口的进程')
    parser.add_argument('--find-free', action='store_true', help='查找一个可用的端口')
    
    args = parser.parse_args()
    
    if args.find_free:
        free_port = find_free_port(args.port)
        if free_port:
            print(f"找到可用端口: {free_port}")
            print(f"你可以使用以下命令启动服务器:")
            print(f"python run_backend.py --port {free_port}")
            return
        else:
            print(f"在 {args.port}-9000 范围内没有可用端口")
            return
    
    if is_port_in_use(args.port):
        print(f"端口 {args.port} 正在使用中")
        processes = find_process_using_port(args.port)
        
        if not processes:
            print("无法确定使用该端口的进程")
            return
        
        print(f"使用端口 {args.port} 的进程:")
        for pid, process in processes:
            print(f"PID: {pid}, 进程: {process}")
        
        if args.kill:
            for pid, _ in processes:
                print(f"正在终止进程 {pid}...")
                if kill_process(pid):
                    print(f"进程 {pid} 已终止")
                else:
                    print(f"无法终止进程 {pid}")
            
            # 再次检查端口是否可用
            if not is_port_in_use(args.port):
                print(f"端口 {args.port} 现在可用")
            else:
                print(f"端口 {args.port} 仍然被占用")
        else:
            print("使用 --kill 选项可以终止这些进程")
    else:
        print(f"端口 {args.port} 可用")

if __name__ == "__main__":
    main()
