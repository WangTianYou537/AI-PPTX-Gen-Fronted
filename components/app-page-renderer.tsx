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
}

export function AppPageRenderer({ page, user }: AppPageRendererProps) {
  if (page.startsWith("admin.") && user.role !== "admin") {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>无权限访问</AlertTitle>
        <AlertDescription>当前账号没有后台管理权限。</AlertDescription>
      </Alert>
    )
  }

  switch (page) {
    case "admin.users":
      return <UserManagement currentUser={user} />
    case "admin.roles":
      return <PromptSettingsPanel />
    case "admin.storage":
      return <StorageSettings />
    case "system.help":
      return <HelpPage isAdmin={user.role === "admin"} />
    case "workspace.overview":
    case "workspace.topic":
    case "workspace.outline":
    case "workspace.svg":
    default:
      return <PPTWorkspace compact />
  }
}

function HelpPage({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WandSparklesIcon />
            PPT 生成流程
          </CardTitle>
          <CardDescription>从主题输入到 PPTX 导出的完整链路。</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm text-muted-foreground">
            <li>输入主题、目标受众、期望页数和视觉风格。</li>
            <li>生成 PPT 架构后审核并修改 JSON。</li>
            <li>生成每页 SVG，预览效果并复制源码。</li>
            <li>确认后导出为可下载的 PPTX 文件。</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon />
            角色模型配置
          </CardTitle>
          <CardDescription>管理员可配置不同生成角色的模型和提示词。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>PPT 架构师负责输出结构化大纲。</p>
            <p>PPT-SVG 生成器负责输出每页可预览 SVG。</p>
            <p>支持 OpenAI-compatible、Gemini 和 Claude 配置。</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheckIcon />
            当前权限
          </CardTitle>
          <CardDescription>菜单会根据账号角色自动展示。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>{isAdmin ? "当前账号可访问后台管理。" : "当前账号仅可访问 PPT 生成和系统说明。"}</p>
            <p>后台 API 仍由服务端权限控制，前端菜单只负责展示和导航。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
