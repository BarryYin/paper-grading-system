#!/bin/bash
# 检查后端服务是否运行
echo "检查后端服务状态..."
curl -s http://localhost:8000/ > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ 后端服务正在运行"
else
  echo "❌ 后端服务未运行。请在终端执行以下命令启动服务:"
  echo "cd /Users/mac/Documents/GitHub/paper-grading-system/backend/"
  echo "python main.py"
fi
