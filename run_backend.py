import sys
import os
import uvicorn
import argparse
import socket

# 确保当前目录在Python路径中，以解决相对导入问题
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 确保backend目录也在Python路径中
backend_dir = os.path.join(current_dir, "backend")
sys.path.append(backend_dir)

# 确保backend/__init__.py文件存在，使其成为一个有效的Python包
init_file = os.path.join(backend_dir, "__init__.py")
if not os.path.exists(init_file):
    with open(init_file, 'w') as f:
        f.write("# 此文件使backend目录成为一个Python包\n")

def is_port_in_use(port: int) -> bool:
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_free_port(start_port: int = 8000, max_attempts: int = 100) -> int:
    """查找可用端口"""
    port = start_port
    attempts = 0
    
    while is_port_in_use(port) and attempts < max_attempts:
        port += 1
        attempts += 1
    
    if attempts >= max_attempts:
        raise RuntimeError(f"无法在 {start_port}-{start_port+max_attempts-1} 范围内找到可用端口")
    
    return port

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='运行论文评分系统后端服务')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='绑定地址 (默认: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8000, help='绑定端口 (默认: 8000)')
    parser.add_argument('--reload', action='store_true', help='启用自动重载')
    parser.add_argument('--auto-port', action='store_true', help='自动选择可用端口')
    parser.add_argument('--disable-auth', action='store_true', help='禁用认证功能')
    parser.add_argument('--debug', action='store_true', help='显示详细调试信息')
    
    args = parser.parse_args()
    
    port = args.port
    
    # 如果指定了自动选择端口，找一个可用端口
    if args.auto_port or is_port_in_use(port):
        if is_port_in_use(port):
            print(f"警告: 端口 {port} 已被占用")
        
        port = find_free_port(port)
        print(f"使用可用端口: {port}")
    
    # 打印导入路径和启动信息
    if args.debug:
        print("=== 调试信息 ===")
        print(f"Python路径: {sys.path}")
        print(f"当前目录: {current_dir}")
        print(f"后端目录: {backend_dir}")
        print("=== 环境变量 ===")
        for key, value in sorted(os.environ.items()):
            if key.startswith('PYTHON') or key == 'PATH':
                print(f"{key}: {value}")
    
    # 如果禁用认证，添加环境变量
    if args.disable_auth:
        print("已禁用认证功能")
        os.environ["DISABLE_AUTH"] = "1"
    
    print(f"启动后端服务: http://{args.host if args.host != '0.0.0.0' else 'localhost'}:{port}")
    print(f"API文档: http://{args.host if args.host != '0.0.0.0' else 'localhost'}:{port}/docs")
    
    # 启动服务器，并将运行时的Python路径设置为当前路径
    os.chdir(current_dir)  # 改变工作目录，确保相对路径正确
    
    # 启动服务器
    uvicorn.run(
        "backend.main:app", 
        host=args.host, 
        port=port, 
        reload=args.reload
    )
