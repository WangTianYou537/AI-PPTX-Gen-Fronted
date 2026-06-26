"use client"

import * as React from "react"
import { toast } from "sonner"
import { exportPPTX, generateOutline, generateSVG } from "@/lib/api"
import type { PresentationOutline, SlideSVG, TopicInput } from "@/lib/types"
import type { AppPageId } from "@/lib/navigation"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { OutlineEditor } from "@/components/outline-editor"
import { SVGPreviewGrid } from "@/components/svg-preview-grid"
import { TopicForm } from "@/components/topic-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  BotIcon, 
  FileImageIcon, 
  PanelsTopLeftIcon, 
  ArrowRightIcon, 
  ChevronLeftIcon,
  SparklesIcon,
  FileTextIcon
} from "lucide-react"

const defaultTopic: TopicInput = {
  topic: "",
  audience: "本科大学生",
  slideCount: 8,
  style: "科技、简洁、视觉化",
}

type PPTWorkspaceProps = {
  compact?: boolean
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
}

function safeFilename(title: string) {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]/g, "-").slice(0, 80)
  return cleaned || "ppt-gen"
}

export function PPTWorkspace({ compact = false, activePage, onPageChange }: PPTWorkspaceProps) {
  const [topic, setTopic] = React.useState<TopicInput>(defaultTopic)
  const [outline, setOutline] = React.useState<PresentationOutline | null>(null)
  const [outlineDraft, setOutlineDraft] = React.useState("")
  const [outlineError, setOutlineError] = React.useState("")
  const [svgs, setSVGs] = React.useState<SlideSVG[]>([])
  
  const [isArchitecting, setIsArchitecting] = React.useState(false)
  const [isGeneratingSVG, setIsGeneratingSVG] = React.useState(false)
  const [isExportingPPTX, setIsExportingPPTX] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)

  // 生成大纲并自动跳转
  async function handleGenerateOutline() {
    setError(null)
    setIsArchitecting(true)
    try {
      const nextOutline = await generateOutline(topic)
      setOutline(nextOutline)
      setOutlineDraft(JSON.stringify(nextOutline, null, 2))
      setSVGs([]) 
      toast.success("PPT 架构已生成")
      onPageChange("workspace.outline")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成架构失败")
    } finally {
      setIsArchitecting(false)
    }
  }

  function handleApplyOutline() {
    try {
      const parsed = JSON.parse(outlineDraft) as PresentationOutline
      if (!parsed.title || !Array.isArray(parsed.slides)) {
        throw new Error("必须包含 title 和 slides")
      }
      setOutline(parsed)
      setOutlineError("")
      toast.success("架构修改已应用")
    } catch (err) {
      const message = err instanceof Error ? err.message : "JSON 格式有误"
      setOutlineError(message)
      toast.error(message)
    }
  }

  // 生成 SVG 并自动跳转
  async function handleGenerateSVG() {
    if (!outline) {
      toast.error("大纲架构为空，请先生成架构")
      return
    }
    setError(null)
    setIsGeneratingSVG(true)
    try {
      const response = await generateSVG(outline)
      setSVGs(response.slides)
      toast.success("SVG 页面已生成")
      onPageChange("workspace.ppt")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成 SVG 失败")
    } finally {
      setIsGeneratingSVG(false)
    }
  }

  async function handleExportPPTX() {
    if (svgs.length === 0) {
      return
    }
    setIsExportingPPTX(true)
    try {
      const title = outline?.title || "ppt-gen"
      const blob = await exportPPTX(title, svgs)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${safeFilename(title)}.pptx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success("PPTX 已导出")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "导出 PPTX 失败")
    } finally {
      setIsExportingPPTX(false)
    }
  }

  // 渲染激活步骤的子视图
  const renderActiveStep = () => {
    switch (activePage) {
      case "workspace.overview":
        return (
          /* 🚀 右侧大卡片：使用 h-full 与 flex flex-col 铺满高度 */
          <Card className="h-full flex flex-col border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold">智能演示文稿创作台</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                AI 将引导你通过 3 个简单的步骤高效完成 PPT 设计，你可以随时在侧边栏切换、预览或返回修改。
              </CardDescription>
            </CardHeader>
            {/* 🚀 flex-grow 撑满，并将按钮推到最底下 */}
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <div className="grid gap-4 sm:grid-cols-3">
                
                <div className="rounded-xl border border-border/40 p-4 bg-muted/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PanelsTopLeftIcon className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground">第一步：输入主题</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      提供您的演示主题、受众群体、页数风格，PPT 架构师快速为您规划整套大纲框架。
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/40 p-4 bg-muted/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileTextIcon className="h-4.5 w-4.5 text-violet-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground">第二步：精修架构</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      审核并按需调整每张页面的核心论点和视觉提示词，在此阶段进行定制。
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/40 p-4 bg-muted/25 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileImageIcon className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground">第三步：渲染与导出</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      实时生成高保真幻灯片效果，完成细节微调后即可一键打包、导出标准 PPTX 文件。
                    </p>
                  </div>
                </div>

              </div>
              
              <div className="flex justify-end pt-3 border-t border-border/30">
                <Button onClick={() => onPageChange("workspace.topic")} size="default" className="gap-2 text-sm font-medium cursor-pointer">
                  进入第一步：设定主题
                  <SparklesIcon className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "workspace.topic":
        return (
          <Card className="border-border/60 shadow-2xs">
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold">输入演示主题</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                告诉 PPT 架构师你想表达什么、受众是谁、希望生成几页。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopicForm
                value={topic}
                isLoading={isArchitecting}
                onChange={setTopic}
                onSubmit={handleGenerateOutline}
              />
            </CardContent>
          </Card>
        )

      case "workspace.outline":
        if (!outline) {
          return (
            <Card className="border-dashed border-2 border-border/60 bg-card/40 backdrop-blur-sm shadow-none py-14 text-center">
              <CardContent className="flex flex-col items-center justify-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                  <BotIcon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-semibold text-foreground">暂无大纲架构</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    大纲架构尚未生成，请先在侧栏切换到“主题输入”提交给 PPT 架构师。
                  </p>
                </div>
                <Button 
                  size="default" 
                  variant="outline" 
                  onClick={() => onPageChange("workspace.topic")}
                  className="mt-2 text-sm gap-2 cursor-pointer"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  前往设定主题
                </Button>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold">审核并调整大纲结构</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                在确认每页的标题、表达目的和视觉提示后，即可一键生成 SVG 画幅。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutlineEditor
                outline={outline}
                draft={outlineDraft}
                error={outlineError}
                isGenerating={isGeneratingSVG}
                onDraftChange={setOutlineDraft}
                onApply={handleApplyOutline}
                onGenerateSVG={handleGenerateSVG}
              />
            </CardContent>
          </Card>
        )

      case "workspace.ppt":
        if (!svgs || svgs.length === 0) {
          return (
            <Card className="border-dashed border-2 border-border/60 bg-card/40 backdrop-blur-sm shadow-none py-14 text-center">
              <CardContent className="flex flex-col items-center justify-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-500">
                  <FileImageIcon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-semibold text-foreground">暂无幻灯片预览</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    请确保在“大纲审核”中调整大纲并保存后，一键生成渲染出幻灯片。
                  </p>
                </div>
                <Button 
                  size="default" 
                  variant="outline" 
                  onClick={() => {
                    if (outline) {
                      onPageChange("workspace.outline")
                    } else {
                      onPageChange("workspace.topic")
                    }
                  }}
                  className="mt-2 text-sm gap-2 cursor-pointer"
                >
                  {outline ? "前往架构审核" : "去设定主题"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        }
        return (
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-sm">
            <SVGPreviewGrid
              slides={svgs}
              isExporting={isExportingPPTX}
              onExportPPTX={handleExportPPTX}
            />
          </div>
        )

      default:
        return null
    }
  }

  const isOverview = activePage === "workspace.overview"

  return (
    <div className={compact ? "bg-background" : "min-h-svh bg-background/30"}>
      {/* 🚀 section 使用 flex-1 撑开 */}
      <section className={compact ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8"}>

        {error ? <DebugErrorAlert title="请求失败" error={error} /> : null}

        {/* 根据是否为总览页，动态切换双栏/单栏通栏布局 */}
        {isOverview ? (
          /* A. 总览双栏视图 */
          /* 🚀 给网格容器强制增加 items-stretch 属性，确保左右两个栏目高度自适应相等 */
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
            
            {/* 🚀 左侧角色模型状态卡片：高度改为 h-full，让其与右侧等高；
                内部容器采用 flex flex-col 布局，并让 CardContent 占据余下高度 */}
            <Card className="h-full flex flex-col border-border/50 bg-card/60 backdrop-blur-sm shadow-sm animate-in fade-in duration-300">
              <CardHeader className="pb-3.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BotIcon className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                  角色模型状态
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed mt-0.5">
                  系统根据后台配置自动分发任务
                </CardDescription>
              </CardHeader>
              
              {/* 🚀 CardContent 增加 flex-1 flex flex-col justify-between，
                  强行将状态块留在上方，将备注说明文字推到底部对齐 */}
              <CardContent className="flex-1 flex flex-col justify-between gap-6">
                
                <div className="space-y-3 rounded-xl bg-muted/40 p-4 border border-border/30 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">PPT 架构师</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      已就绪
                    </span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">页面生成器</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      已就绪
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  模型与 API 密钥由管理员统一管理。若生成中提示模型配置异常，请联系系统管理员。
                </p>
              </CardContent>
            </Card>

            {/* 🚀 右侧总览：容器高度设为 h-full */}
            <div className="min-w-0 h-full flex flex-col">
              {renderActiveStep()}
            </div>
          </div>
        ) : (
          /* B. 创作单栏视图：充分利用横向屏幕面积 */
          <div className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderActiveStep()}
          </div>
        )}

      </section>
    </div>
  )
}