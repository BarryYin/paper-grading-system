"""
日志工具 - 提供统一的日志记录机制
"""
import os
import logging
from datetime import datetime

# 配置日志记录
def setup_logger(name, log_file=None, level=logging.INFO):
    """设置日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # 创建格式器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 添加控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 如果提供了日志文件，添加文件处理器
    if log_file:
        # 确保日志目录存在
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

# 默认日志保存位置
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BACKEND_DIR, 'logs')
AUTH_LOG_FILE = os.path.join(LOG_DIR, 'auth.log')

# 创建认证日志记录器
auth_logger = setup_logger('auth', AUTH_LOG_FILE)

# 提供便捷的日志记录函数
def log_auth_success(username, user_id=None, method="login"):
    """记录认证成功事件"""
    user_info = f"用户: {username}" + (f" (ID: {user_id})" if user_id else "")
    auth_logger.info(f"{method.upper()} 成功 - {user_info}")

def log_auth_failure(username, reason, method="login"):
    """记录认证失败事件"""
    auth_logger.warning(f"{method.upper()} 失败 - 用户: {username}, 原因: {reason}")

def log_debug(message):
    """记录调试信息"""
    auth_logger.debug(message)

def log_error(message, exc_info=None):
    """记录错误信息"""
    auth_logger.error(message, exc_info=exc_info)

if __name__ == "__main__":
    # 测试日志记录
    print(f"日志文件位置: {AUTH_LOG_FILE}")
    log_auth_success("test_user", "123", "测试")
    log_auth_failure("bad_user", "密码错误", "测试")
    log_debug("这是一条调试消息")
    log_error("这是一条错误消息")
    print("日志测试完成")
