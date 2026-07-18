# PPT 生成前端

这是 PPT 生成系统的 Next.js 前端，负责产品首页、登录注册、初始化管理员、PPT 生成工作台、用户管理、角色模型配置和存储配置等界面。

构建产物为静态导出（`output: "export"`），由后端 Go 服务 embed 并同源托管。

## 主要路由

| 路径 | 说明 |
|---|---|
| `/` | 公共产品首页（Landing）。按登录状态显示登录/注册或进入控制台 |
| `/login` | 登录页 |
| `/register` | 注册页 |
| `/signup` | 注册页别名 |
| `/workspace` | 工作台总览（受保护） |
| `/workspace/topic` | 主题输入 |
| `/workspace/outline` | 架构审核 |
| `/workspace/ppt` | PPT 预览与导出 |
| `/admin/users` | 用户管理（管理员） |
| `/admin/groups` | 用户组管理（管理员） |
| `/admin/settings` | 系统设置（管理员） |
| `/admin/roles` | 角色模型配置（管理员） |
| `/admin/storage` | 存储管理（管理员） |
| `/help` | 帮助与说明 |

## 结构说明

- 主业务导航由 `lib/navigation.ts` 定义（`AppPageId` ↔ path）
- 受保护页面统一由 `app/(protected)/layout.tsx` 包裹 `AppShell`
- `AppShell` 负责 setup/登录检查、侧边栏、权限与骨架屏
- 工作台状态挂在 `workspace` layout 下的 `WorkspaceRouteShell`，步骤间切换不丢状态
- API 封装在 `lib/api.ts`，类型在 `lib/types.ts`

## 环境变量

如果前端和后端不是同源部署，可以设置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

未设置时，前端会使用同源地址请求 `/api/*`。

## 常用命令

```bash
npm run dev        # 启动开发服务器
npm run typecheck  # TypeScript 类型检查
npm run lint       # ESLint 检查
npm run build      # 静态导出到 out/
```

生产构建通常由仓库根目录的 `../build.sh` 统一完成：前端导出 → 拷贝到 `internal/web/dist` → Go 测试/编译。
