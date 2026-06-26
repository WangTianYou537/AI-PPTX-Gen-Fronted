"use client"

import * as React from "react"
import { toast } from "sonner"
import { exportPPTX, generateOutline, generateSVG } from "@/lib/api"
import type { PresentationOutline, SlideSVG, TopicInput } from "@/lib/types"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { OutlineEditor } from "@/components/outline-editor"
import { SVGPreviewGrid } from "@/components/svg-preview-grid"
import { TopicForm } from "@/components/topic-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotIcon, FileImageIcon, PanelsTopLeftIcon } from "lucide-react"

const defaultTopic: TopicInput = {
  topic: "",
  audience: "投资人",
  slideCount: 8,
  style: "科技、简洁、视觉化",
}

type PPTWorkspaceProps = {
  compact?: boolean
}

function safeFilename(title: string) {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]/g, "-").slice(0, 80)
  return cleaned || "ppt-gen"
}

export function PPTWorkspace({ compact = false }: PPTWorkspaceProps) {
  const [topic, setTopic] = React.useState<TopicInput>(defaultTopic)
  const [outline, setOutline] = React.useState<PresentationOutline | null>(null)
  const [outlineDraft, setOutlineDraft] = React.useState("")
  const [outlineError, setOutlineError] = React.useState("")
  const [svgs, setSVGs] = React.useState<SlideSVG[]>([])
  const [isArchitecting, setIsArchitecting] = React.useState(false)
  const [isGeneratingSVG, setIsGeneratingSVG] = React.useState(false)
  const [isExportingPPTX, setIsExportingPPTX] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)

  async function handleGenerateOutline() {
    setError(null)
    setIsArchitecting(true)
    try {
      const nextOutline = await generateOutline(topic)
      setOutline(nextOutline)
      setOutlineDraft(JSON.stringify(nextOutline, null, 2))
      setSVGs([])
      toast.success("PPT 架构已生成")
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

  async function handleGenerateSVG() {
    if (!outline) {
      return
    }
    setError(null)
    setIsGeneratingSVG(true)
    try {
      const response = await generateSVG(outline)
      setSVGs(response.slides)
      toast.success("SVG 页面已生成")
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

  async function copySVG(svg: string) {
    await navigator.clipboard.writeText(svg)
    toast.success("SVG 已复制")
  }

  return (
    <div className={compact ? "bg-background" : "min-h-svh bg-background/50"}>
      <section className={compact ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8"}>

        {/* 头部展示区 */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/40 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <Badge className="w-fit" variant="secondary">
                AI PPT Generator
              </Badge>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                  AI 生成 PPT 工作台
                </h1>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  先由 PPT 架构师生成结构，人工审核修改后，再让 SVG 生成器输出每页可预览画面。
                </p>
              </div>
            </div>

            {/* 步骤工作流指示 */}
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 p-2 text-sm shadow-2xs self-start lg:self-center">
              <span className="text-xs text-muted-foreground px-2">当前进度:</span>
              <Badge variant={outline ? "default" : "secondary"} className="gap-1.5 px-3 py-1 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full ${outline ? 'bg-background' : 'bg-primary'}`} />
                1 架构
              </Badge>
              <span className="text-muted-foreground/30 text-xs">/</span>
              <Badge variant={svgs.length ? "default" : "outline"} className="gap-1.5 px-3 py-1 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full ${svgs.length ? 'bg-background' : 'bg-muted-foreground/30'}`} />
                2 SVG
              </Badge>
            </div>
          </div>
        </div>

        {error ? <DebugErrorAlert title="请求失败" error={error} /> : null}

        {/* 主工作区 */}
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

          {/* 左侧角色模型信息卡片 */}
          <Card className="h-fit border-border/60 shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <BotIcon className="h-4 w-4 text-primary" />
                角色模型状态
              </CardTitle>
              <CardDescription className="text-xs">
                系统根据后台配置自动分发生成任务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl bg-muted/40 p-3.5 border border-border/30 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">PPT 架构师</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    已就绪
                  </span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">SVG 生成器</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    已就绪
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                模型与 API 密钥由管理员统一管理。若生成中提示模型配置异常，请联系系统管理员在“后台管理 / 角色模型”中补全配置。
              </p>
            </CardContent>
          </Card>

          {/* 右侧主操控区域 */}
          <Tabs defaultValue="topic" className="min-w-0">
            <div className="border-b pb-1">
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="topic" className="gap-2 text-xs md:text-sm">
                  <PanelsTopLeftIcon className="h-4 w-4" />
                  1. 设定主题
                </TabsTrigger>
                <TabsTrigger value="outline" className="gap-2 text-xs md:text-sm">
                  2. 架构审核
                </TabsTrigger>
                <TabsTrigger value="svg" className="gap-2 text-xs md:text-sm">
                  <FileImageIcon className="h-4 w-4" />
                  3. SVG 预览
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-4">
              <TabsContent value="topic" className="m-0 focus-visible:outline-none">
                <Card className="border-border/60 shadow-2xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">输入演示主题</CardTitle>
                    <CardDescription>告诉 PPT 架构师你想表达什么、受众是谁、希望生成几页。</CardDescription>
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
              </TabsContent>

              <TabsContent value="outline" className="m-0 focus-visible:outline-none">
                <Card className="border-border/60 shadow-2xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">审核并调整大纲结构</CardTitle>
                    <CardDescription>在确认每页的标题、表达目的和视觉提示后，即可一键生成 SVG 画幅。</CardDescription>
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
              </TabsContent>

              <TabsContent value="svg" className="m-0 focus-visible:outline-none">
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xs">
                  <SVGPreviewGrid
                    slides={svgs}
                    isExporting={isExportingPPTX}
                    onCopy={copySVG}
                    onExportPPTX={handleExportPPTX}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
