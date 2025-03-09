# 论文评分系统路由文档

本文档列出系统中的所有路由路径及其功能说明，帮助开发人员了解系统结构。

## 前端路由

### 公共路由
- `/login` - 用户登录页面

### 受保护路由（需要登录）
- `/` - 系统首页仪表盘
- `/submissions` - 论文列表页面
- `/submissions/:id` - 论文详情页面，其中`:id`是动态论文ID

## 后端API路由

### 认证相关
- `POST /api/auth/login` - 表单登录
- `POST /api/auth/login/json` - JSON登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出

### 论文管理
- `GET /api/submissions` - 获取所有论文列表
- `GET /api/submissions/:id` - 获取特定论文详情
- `POST /api/submissions` - 创建新论文
- `PUT /api/submissions/:id` - 更新论文信息
- `DELETE /api/submissions/:id` - 删除论文
- `POST /api/submissions/:id/grade` - 给论文评分和反馈

### 调试端点（仅开发环境可用）
- `GET /api/auth/debug-cookies` - 查看当前cookies
- `POST /api/auth/debug-login` - 调试用登录
- `GET /api/auth/debug-users` - 查看用户列表
- `POST /api/auth/debug-verify-password` - 测试密码验证

## 路由参数说明

### 论文ID格式
论文ID使用格式为`recXXXXXXXX`的字符串，例如：
- `receDrtyx8`
- `recuEG6Z8QuOWy`
- `recPFmvHG1`

在访问论文详情页时，请确保使用正确的ID格式，如：
```
http://localhost:3000/submissions/receDrtyx8
```

## 已知问题

如果遇到404错误，请检查：
1. 论文ID是否存在于数据库中
2. 前端路由配置是否正确
3. 后端API是否正常响应
