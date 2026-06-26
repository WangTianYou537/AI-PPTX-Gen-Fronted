# PPT 生成前端

这是 PPT 生成系统的 Next.js 前端，负责登录注册、初始化管理员、PPT 生成工作台、用户管理、角色模型配置和存储配置等界面。

## 主要路由

- `/`：主应用入口，加载 `AppShell`，根据初始化状态和登录状态进入工作台或跳转登录。
- `/login`：登录页。
- `/register`：注册页。
- `/signup`：注册页别名。

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
npm run build      # 构建/静态导出
```

## 说明

本项目使用 Next.js App Router 和 shadcn/ui 组件。主业务导航由 `lib/navigation.ts` 定义，页面内容由 `components/app-page-renderer.tsx` 分发渲染。
