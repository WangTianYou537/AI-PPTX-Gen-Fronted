"use client"

import * as React from "react"
import { toast } from "sonner"
import { exportPPTX, generateOutline, generateSVG } from "@/lib/api"
import type { PresentationOutline, SlideSVG, TopicInput } from "@/lib/types"
import { OutlineEditor } from "@/components/outline-editor"
import { SVGPreviewGrid } from "@/components/svg-preview-grid"
import { TopicForm } from "@/components/topic-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircleIcon, BotIcon, FileImageIcon, PanelsTopLeftIcon } from "lucide-react"

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
  const [error, setError] = React.useState("")

  async function handleGenerateOutline() {
    setError("")
    setIsArchitecting(true)
    try {
      const nextOutline = await generateOutline(topic)
      setOutline(nextOutline)
      setOutlineDraft(JSON.stringify(nextOutline, null, 2))
      setSVGs([])
      toast.success("PPT 架构已生成")
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成架构失败"
      setError(message)
      toast.error(message)
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
    setError("")
    setIsGeneratingSVG(true)
    try {
      const response = await generateSVG(outline)
      setSVGs(response.slides)
      toast.success("SVG 页面已生成")
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成 SVG 失败"
      setError(message)
      toast.error(message)
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
      const message = err instanceof Error ? err.message : "导出 PPTX 失败"
      setError(message)
      toast.error(message)
    } finally {
      setIsExportingPPTX(false)
    }
  }

  async function copySVG(svg: string) {
    await navigator.clipboard.writeText(svg)
    toast.success("SVG 已复制")
  }

  return (
    <div className={compact ? "bg-background" : "min-h-svh bg-background"}>
      <section className={compact ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8"}>
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <Badge className="w-fit" variant="secondary">
              AI PPT Generator
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">AI 生成 PPT 工作台</h1>
              <p className="text-muted-foreground md:text-lg">
                先由 PPT 架构师生成结构，人工审核修改后，再让 SVG 生成器输出每页可预览画面。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={outline ? "default" : "outline"}>1 架构</Badge>
            <Badge variant={svgs.length ? "default" : "outline"}>2 SVG</Badge>
            <Badge variant="secondary">后台角色模型</Badge>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>请求失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BotIcon />
                角色模型
              </CardTitle>
              <CardDescription>模型和 API Key 由管理员在后台按生成角色统一配置。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <p>当前工作台会自动使用后台设置的 PPT 架构师模型和 PPT-SVG 生成器模型。</p>
                <p>如果生成失败并提示模型未配置，请联系管理员到“后台管理 / 角色模型”中补全配置。</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="topic" className="min-w-0">
            <TabsList>
              <TabsTrigger value="topic">
                <PanelsTopLeftIcon data-icon="inline-start" />
                主题
              </TabsTrigger>
              <TabsTrigger value="outline">架构审核</TabsTrigger>
              <TabsTrigger value="svg">
                <FileImageIcon data-icon="inline-start" />
                SVG 预览
              </TabsTrigger>
            </TabsList>
            <Separator className="my-4" />
            <TabsContent value="topic">
              <Card>
                <CardHeader>
                  <CardTitle>输入主题</CardTitle>
                  <CardDescription>告诉 PPT 架构师你想表达什么、给谁看、希望几页。</CardDescription>
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
            <TabsContent value="outline">
              <Card>
                <CardHeader>
                  <CardTitle>审核并修改 PPT 架构</CardTitle>
                  <CardDescription>确认每页标题、目的、要点和视觉提示后，再生成 SVG。</CardDescription>
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
            <TabsContent value="svg">
              <SVGPreviewGrid slides={svgs} isExporting={isExportingPPTX} onCopy={copySVG} onExportPPTX={handleExportPPTX} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
