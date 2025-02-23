# 论文评分系统

一个基于Next.js开发的智能论文评分系统，帮助用户快速获取论文评分和改进建议。

## 项目简介

论文评分系统是一个现代化的Web应用，旨在为用户提供便捷的论文评估服务。系统采用直观的界面设计，支持论文上传和即时评分功能。

## 技术栈

- **前端框架**: Next.js 14
- **UI组件**: 
  - Radix UI
  - Tailwind CSS
  - shadcn/ui组件库
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS

## 主要功能

### 1. 论文上传
- 支持文件上传功能
- 提供直观的文件选择界面
- 实时上传进度显示

### 2. 评分结果展示
- 详细的评分反馈
- 可视化的评分数据展示
- 改进建议提供

## 安装说明

1. 克隆项目
```bash
git clone [项目地址]
cd paper-grading-system
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问应用
打开浏览器访问 http://localhost:3000

## 项目结构

```
/app                    # Next.js应用主目录
  /page.tsx            # 主页面
  /result              # 评分结果页面
/components            # React组件
  /ui                  # UI组件库
  /FileUploadButton.tsx# 文件上传组件
/public                # 静态资源
/styles                # 样式文件
```

## 使用指南

1. 在主页面点击上传按钮选择需要评分的论文文件
2. 等待系统处理和评分
3. 在结果页面查看详细的评分和建议

## 开发环境

- Node.js 18+
- npm 或 yarn
- 现代浏览器（支持ES6+）

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证

本项目采用 MIT 许可证。