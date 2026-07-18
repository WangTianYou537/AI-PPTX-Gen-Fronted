"use client"

import type { ComponentType } from "react"
import { BotIcon, FileImageIcon, FileTextIcon, PanelsTopLeftIcon, SparklesIcon } from "lucide-react"
import type { AppPageId } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function WorkspaceOverviewStep({ onPageChange }: { onPageChange: (page: AppPageId) => void }) {
  return (
    <div className="grid h-full gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
      <Card className="flex h-full flex-col border-border/50 bg-card/60 shadow-sm backdrop-blur-sm animate-in fade-in duration-300">
        <CardHeader className="pb-3.5">
          <BotIcon className="h-4.5 w-4.5 shrink-0 text-indigo-500" />
          角色模型状态
          <CardDescription className="mt-0.5 text-xs leading-relaxed">系统根据后台配置自动分发任务</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <div className="space-y-3 rounded-xl border border-border/30 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">PPT 架构师</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                已就绪
              </span>
            </div>
            <Separator className="bg-border/30" />
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">页面生成器</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                已就绪
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            模型与 API 密钥由管理员统一管理。若生成中提示模型配置异常，请联系系统管理员。
          </p>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-5">
          <CardTitle className="text-lg font-semibold">智能演示文稿创作台</CardTitle>
          <CardDescription className="mt-1 text-sm leading-relaxed">
            AI 将引导你通过 3 个简单的步骤高效完成 PPT 设计，你可以随时在侧边栏切换、预览或返回修改。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StepCard icon={PanelsTopLeftIcon} title="第一步：输入主题" description="提供演示主题、受众群体、页数风格，PPT 架构师快速规划整套大纲框架。" />
            <StepCard icon={FileTextIcon} title="第二步：精修架构" description="审核并按需调整每张页面的核心论点和视觉提示词。" />
            <StepCard icon={FileImageIcon} title="第三步：渲染与导出" description="实时生成高保真幻灯片效果，完成后一键打包导出标准 PPTX。" />
          </div>
          <div className="flex justify-end border-t border-border/30 pt-3">
            <Button onClick={() => onPageChange("workspace.topic")} size="default" className="cursor-pointer gap-2 text-sm font-medium">
              进入第一步：设定主题
              <SparklesIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StepCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/40 bg-muted/25 p-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4.5 w-4.5 shrink-0 text-indigo-500" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
