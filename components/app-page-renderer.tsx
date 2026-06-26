"use client"

import type { User } from "@/lib/types"
import type { AppPageId } from "@/lib/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PPTWorkspace } from "@/components/ppt-workspace"
import { PromptSettingsPanel } from "@/components/prompt-settings"
import { StorageSettings } from "@/components/storage-settings"
import { UserManagement } from "@/components/user-management"
import { AlertCircleIcon, BadgeCheckIcon, SettingsIcon, WandSparklesIcon } from "lucide-react"

type AppPageRendererProps = {
  page: AppPageId
  user: User
  onPageChange: (page: AppPageId) => void
}

export function AppPageRenderer({ page, user, onPageChange }: AppPageRendererProps) {
  // 权限检查
  if (page.startsWith("admin.") && user.role !== "admin") {
    return (
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
        <AlertCircleIcon className="size-4.5" />
        <AlertTitle className="text-sm font-semibold">无权限访问</AlertTitle>
        <AlertDescription className="text-sm mt-1">当前账号没有后台管理权限。</AlertDescription>
      </Alert>
    )
  }

  // 核心：PPT 生成工作台页面拦截渲染
  if (page.startsWith("workspace.")) {
    return (
      <PPTWorkspace
        compact
        activePage={page}
        onPageChange={onPageChange}
      />
    )
  }

  // 后台管理及系统页面
  switch (page) {
    case "admin.users":
      return <UserManagement currentUser={user} />
    case "admin.roles":
      return <PromptSettingsPanel />
    case "admin.storage":
      return <StorageSettings />
    case "system.help":
      return <HelpPage isAdmin={user.role === "admin"} />
    default:
      return (
        <PPTWorkspace
          compact
          activePage="workspace.overview"
          onPageChange={onPageChange}
        />
      )
  }
}

function HelpPage({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      
      {/* PPT 生成流程卡 */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <WandSparklesIcon className="size-4.5 text-indigo-500 shrink-0" />
            PPT 生成流程
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed mt-1">从主题输入到 PPTX 导出的完整链路。</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex list-decimal flex-col gap-2.5 pl-4 text-sm text-muted-foreground leading-relaxed">
            <li>输入演示主题、目标受众、期望页数和视觉风格。</li>
            <li>生成 PPT 架构后，对页面大纲进行审核与可视化修改。</li>
            <li>渲染各页面高保真 SVG，预览排版效果。</li>
            <li>确认演示大纲与版面效果无误后，一键导出为标准的 PPTX。</li>
          </ol>
        </CardContent>
      </Card>

      {/* 角色模型配置卡 */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <SettingsIcon className="size-4.5 text-violet-500 shrink-0" />
            角色模型配置
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed mt-1">管理员可配置不同生成角色的模型和提示词。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong>PPT 架构师</strong>负责输出合理、有深度、逻辑性强的多级结构化大纲。</p>
            <p><strong>PPT-SVG 生成器</strong>负责将大纲细节转换并渲染为支持实时预览的高保真卡片。</p>
            <p>完美支持主流的 OpenAI-compatible、Gemini、Claude 等模型接口配置。</p>
          </div>
        </CardContent>
      </Card>

      {/* 当前权限卡 */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BadgeCheckIcon className="size-4.5 text-emerald-500 shrink-0" />
            当前权限
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed mt-1">系统菜单及高级管理功能会根据账号角色自动动态分发。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
            <p>{isAdmin ? "🎉 您当前使用的是管理员账号，可以访问系统管理面板。" : "当前登录为普通成员账号，仅开放 PPT 生成及系统说明模块。"}</p>
            <p>除前端导航控制外，底层 API 依然由服务端执行严格的二次越权鉴权控制，保障平台存储及数据调用安全。</p>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}