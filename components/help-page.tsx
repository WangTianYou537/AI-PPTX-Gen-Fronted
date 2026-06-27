import { BadgeCheckIcon, SettingsIcon, WandSparklesIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function HelpPage({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <WandSparklesIcon className="size-4.5 shrink-0 text-indigo-500" />
            PPT 生成流程
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">从主题输入到 PPTX 导出的完整链路。</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex list-decimal flex-col gap-2.5 pl-4 text-sm leading-relaxed text-muted-foreground">
            <li>输入演示主题、目标受众、期望页数和视觉风格。</li>
            <li>生成 PPT 架构后，对页面大纲进行审核与可视化修改。</li>
            <li>渲染各 PPT 页面，预览排版效果。</li>
            <li>确认演示大纲与版面效果无误后，一键导出为标准的 PPTX。</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <SettingsIcon className="size-4.5 shrink-0 text-violet-500" />
            角色模型配置
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">管理员可配置不同生成角色的模型和提示词。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <p><strong>PPT 架构师</strong>负责输出合理、有深度、逻辑性强的多级结构化大纲。</p>
            <p><strong>PPT 页面生成器</strong>负责将大纲细节转换并渲染为支持实时预览的高保真卡片。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BadgeCheckIcon className="size-4.5 shrink-0 text-emerald-500" />
            当前权限
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">系统菜单及高级管理功能会根据账号角色自动动态分发。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <p>{isAdmin ? "🎉 您当前使用的是管理员账号，可以访问系统管理面板。" : "当前登录为普通成员账号，仅开放 PPT 生成及系统说明模块。"}</p>
            <p>除前端导航控制外，底层 API 依然由服务端执行严格的二次越权鉴权控制，保障平台存储及数据调用安全。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
