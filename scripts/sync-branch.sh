#!/bin/bash

# 确保脚本在出错时立即退出
set -e

# 显示颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

echo -e "${BLUE}=== 分支同步工具 ===${NC}"
echo "此脚本将帮助您将main分支的内容同步到feature/001分支"
echo 

# 确保我们在git仓库中
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${RED}错误: 当前目录不是git仓库${NC}"
    exit 1
fi

# 获取当前分支
current_branch=$(git symbolic-ref --short HEAD)
echo -e "${YELLOW}当前分支: ${current_branch}${NC}"
echo

echo "请选择同步方式:"
echo "1. 合并main到feature/001 (安全，保留feature/001的历史记录)"
echo "2. 重置feature/001到main (覆盖feature/001的历史)"
echo "3. 删除并从main重新创建feature/001 (完全重置)"
echo "q. 退出"

read -p "请选择 (1/2/3/q): " choice

case $choice in
    1)
        echo -e "${GREEN}正在执行: 合并main到feature/001${NC}"
        
        # 首先保存当前修改（如果有）
        if ! git diff --quiet; then
            echo "检测到未提交的修改，正在保存..."
            git stash
            stashed=true
        else
            stashed=false
        fi
        
        # 确保本地main是最新的
        echo "更新本地main分支..."
        git checkout main
        git pull origin main
        
        # 切换到feature/001，然后合并main
        echo "切换到feature/001分支并合并main..."
        git checkout feature/001 || git checkout -b feature/001
        git merge main
        
        # 恢复之前的修改（如果有）
        if [ "$stashed" = true ]; then
            echo "恢复之前的修改..."
            git stash pop
        fi
        
        echo -e "${GREEN}完成! feature/001分支现在包含了main分支的所有内容${NC}"
        ;;
        
    2)
        echo -e "${YELLOW}警告: 此操作将覆盖feature/001分支的历史记录${NC}"
        read -p "确定继续? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "操作已取消"
            exit 0
        fi
        
        # 更新main分支
        echo "更新本地main分支..."
        git checkout main
        git pull origin main
        
        # 重置feature/001分支
        echo "重置feature/001分支到main..."
        git checkout -B feature/001 main
        
        echo -e "${GREEN}完成! feature/001分支已重置为main分支的内容${NC}"
        ;;
        
    3)
        echo -e "${RED}警告: 此操作将删除feature/001分支并重新创建${NC}"
        read -p "确定继续? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "操作已取消"
            exit 0
        fi
        
        # 更新main分支
        echo "更新本地main分支..."
        git checkout main
        git pull origin main
        
        # 删除并重新创建feature/001分支
        echo "删除并重新创建feature/001分支..."
        git branch -D feature/001 || true
        git checkout -b feature/001
        
        # 如果需要推送到远程
        read -p "是否将新的feature/001分支推送到远程? (y/n): " push_confirm
        if [ "$push_confirm" = "y" ]; then
            git push -f origin feature/001
            echo "已强制推送到远程feature/001分支"
        fi
        
        echo -e "${GREEN}完成! feature/001分支已重新基于main分支创建${NC}"
        ;;
        
    q)
        echo "操作已取消"
        exit 0
        ;;
        
    *)
        echo -e "${RED}无效的选择${NC}"
        exit 1
        ;;
esac

# 提示用户是否要推送变更
if [ "$choice" = "1" ] || [ "$choice" = "2" ]; then
    read -p "是否将更改推送到远程feature/001分支? (y/n): " push_confirm
    if [ "$push_confirm" = "y" ]; then
        git push origin feature/001
        echo "已推送到远程feature/001分支"
    fi
fi
