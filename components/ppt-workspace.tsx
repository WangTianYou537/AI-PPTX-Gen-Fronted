"use client"

import * as React from "react"
import { toast } from "sonner"
import { exportPPTX, generateOutline, generateSVG } from "@/lib/api"
import type { PresentationOutline, SlideSVG, TopicInput, SlideOutline } from "@/lib/types"
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
  FileTextIcon,
  PlusIcon,
  TrashIcon
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
  
  // 编辑器模式选择
  const [outlineMode, setOutlineMode] = React.useState<"visual" | "json">("visual")

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
      toast.success("PPT 页面已生成")
      onPageChange("workspace.ppt")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成 页面 失败")
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

  // ==========================================
  // 强类型安全的 SlideOutline 编辑与同步函数
  // ==========================================

  const saveVisualChanges = (newOutline: PresentationOutline) => {
    setOutline(newOutline)
    setOutlineDraft(JSON.stringify(newOutline, null, 2))
  }

  const handleUpdateTitle = (val: string) => {
    if (!outline) return
    saveVisualChanges({ ...outline, title: val })
  }

  const handleUpdateSlideField = (
    slideIndex: number, 
    field: "title" | "purpose" | "visualHint", 
    val: string
  ) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = { 
      ...updatedSlides[slideIndex], 
      [field]: val 
    }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleUpdateBullet = (slideIndex: number, bulletIndex: number, val: string) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    const updatedPoints = [...updatedSlides[slideIndex].keyPoints]
    updatedPoints[bulletIndex] = val
    updatedSlides[slideIndex] = { 
      ...updatedSlides[slideIndex], 
      keyPoints: updatedPoints 
    }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleAddBullet = (slideIndex: number) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      keyPoints: [...updatedSlides[slideIndex].keyPoints, ""]
    }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleDeleteBullet = (slideIndex: number, bulletIndex: number) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      keyPoints: updatedSlides[slideIndex].keyPoints.filter((_, i) => i !== bulletIndex)
    }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleAddSlide = () => {
    if (!outline) return
    const newSlide: SlideOutline = {
      id: `slide-${outline.slides.length + 1}`,
      title: `新幻灯片页面 ${outline.slides.length + 1}`,
      purpose: "描述此页面所承载的逻辑意图...",
      keyPoints: ["核心要点内容 1"],
      visualHint: "深色极简风格，使用卡片网格布局"
    }
    saveVisualChanges({ ...outline, slides: [...outline.slides, newSlide] })
  }

  const handleDeleteSlide = (slideIndex: number) => {
    if (!outline) return
    const filtered = outline.slides.filter((_, i) => i !== slideIndex)
    const reindexed = filtered.map((slide, index) => ({
      ...slide,
      id: `slide-${index + 1}`
    }))
    saveVisualChanges({ ...outline, slides: reindexed })
  }

  // 标签安全切换校验
  const handleTabChange = (mode: "visual" | "json") => {
    if (mode === "visual") {
      try {
        const parsed = JSON.parse(outlineDraft) as PresentationOutline
        if (!parsed.title || !Array.isArray(parsed.slides)) {
          throw new Error("格式不完整")
        }
        setOutline(parsed)
        setOutlineError("")
      } catch {
        toast.error("JSON 语法有误，请修复后切换。")
        return
      }
    }
    setOutlineMode(mode)
  }

  // 子视图分流渲染
  const renderActiveStep = () => {
    switch (activePage) {
      case "workspace.overview":
        return (
          <Card className="h-full flex flex-col border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold">智能演示文稿创作台</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                AI 将引导你通过 3 个简单的步骤高效完成 PPT 设计，你可以随时在侧边栏切换、预览或返回修改。
              </CardDescription>
            </CardHeader>
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

      // 1. 设定主题
      case "workspace.topic":
        return (
          <div className="mx-auto max-w-2xl w-full">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
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
          </div>
        )

      // 2. 架构审核（🚀 打碎外层卡片，优化 JSON 区域高度）
      case "workspace.outline":
        if (!outline) {
          return (
            <div className="mx-auto max-w-xl w-full">
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
            </div>
          )
        }
        
        return (
          /* 🚀 取消外层大 Card 包装，大标题直接写在主版面上，彻底斩断“卡片套卡片”现象 */
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="space-y-1.5 pb-1">
              <h2 className="text-lg font-bold text-foreground">审核并调整大纲结构</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                在确认每页的标题、表达目的和要点后，即可一键渲染 PPT 页面。
              </p>
            </div>

            {/* 子模式切换双 Tab 独立成条 */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-4">
              <div className="flex rounded-lg bg-muted/60 p-1">
                <button
                  type="button"
                  onClick={() => handleTabChange("visual")}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    outlineMode === "visual"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileTextIcon className="size-4" />
                  可视化按页编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("json")}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    outlineMode === "json"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BotIcon className="size-4" />
                  直接编辑 JSON
                </button>
              </div>

              {/* 顶部一键生成 PPT */}
              {outlineMode === "visual" && (
                <Button
                  onClick={handleGenerateSVG}
                  disabled={isGeneratingSVG}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-xs font-medium text-white"
                >
                  {isGeneratingSVG ? (
                    <>正在渲染幻灯片...</>
                  ) : (
                    <>
                      一键生成 PPT 页面
                      <ArrowRightIcon className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Tab A: 可视化按页编辑器 (直接呈现在暗色背景上，拥有无与伦比的深色轮廓) */}
            {outlineMode === "visual" && (
              <div className="space-y-6">
                
                {/* PPT 主标题 */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3 shadow-lg shadow-black/40">
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">PPT 主标题</label>
                  <input
                    type="text"
                    value={outline.title}
                    onChange={(e) => handleUpdateTitle(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none pb-1 transition-colors text-zinc-100"
                    placeholder="请输入 PPT 主标题"
                  />
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                    受众群体：<span className="text-zinc-300">{topic.audience}</span> · 视觉倾向：<span className="text-zinc-300">{topic.style}</span>
                  </p>
                </div>

                {/* 幻灯片单页卡片 */}
                <div className="space-y-5">
                  {outline.slides.map((slide, slideIndex) => {
                    return (
                      <div 
                        key={slideIndex} 
                        className="relative rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-5 hover:border-zinc-700 hover:bg-zinc-900/100 transition-all shadow-xl shadow-black/50"
                      >
                        {/* 标题 & slide-序号 */}
                        <div className="flex items-center justify-between gap-4">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => handleUpdateSlideField(slideIndex, "title", e.target.value)}
                            className="text-base font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none flex-1 pb-0.5 transition-colors"
                            placeholder="设置页面标题"
                          />
                          <div className="flex items-center gap-2 shrink-0 select-none">
                            <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wide border border-zinc-700/50">
                              {slide.id || `slide-${slideIndex + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slideIndex)}
                              className="rounded p-1.5 text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="删除此页"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* 设计意图 (purpose) */}
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">设计意图 / 页面功能描述</label>
                          <input
                            type="text"
                            value={slide.purpose}
                            onChange={(e) => handleUpdateSlideField(slideIndex, "purpose", e.target.value)}
                            className="w-full text-sm text-zinc-200 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none py-1 transition-colors placeholder:text-zinc-500"
                            placeholder="描述此页面所承载的逻辑意图，例如：明确课程定位与学习价值"
                          />
                        </div>

                        {/* 核心要点 (keyPoints) */}
                        <div className="space-y-3">
                          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">本页核心要点</label>
                          <div className="space-y-3 pl-2.5">
                            {slide.keyPoints.map((point, bulletIndex) => (
                              <div key={bulletIndex} className="flex items-center gap-2.5 group">
                                <span className="text-indigo-400 text-sm select-none shrink-0">•</span>
                                <input
                                  type="text"
                                  value={point}
                                  onChange={(e) => handleUpdateBullet(slideIndex, bulletIndex, e.target.value)}
                                  className="flex-grow text-sm text-zinc-200 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none pb-0.5 transition-colors placeholder:text-zinc-500"
                                  placeholder="输入要点内容..."
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBullet(slideIndex, bulletIndex)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                                  title="删除此要点"
                                >
                                  <TrashIcon className="size-3.5" />
                                </button>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => handleAddBullet(slideIndex)}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer pt-1"
                            >
                              <PlusIcon className="size-3.5" />
                              新增核心要点
                            </button>
                          </div>
                        </div>

                        <Separator className="bg-zinc-800/80 my-1" />

                        {/* AI视觉提示词 (visualHint) */}
                        <div className="space-y-2">
                          <label className="text-xs text-indigo-400/90 dark:text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <SparklesIcon className="size-3.5" />
                            AI 视觉渲染提示词 (Visual Hint)
                          </label>
                          <input
                            type="text"
                            value={slide.visualHint || ""}
                            onChange={(e) => handleUpdateSlideField(slideIndex, "visualHint", e.target.value)}
                            className="w-full text-xs text-zinc-300 dark:text-zinc-300 font-medium bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none py-1.5 transition-colors italic placeholder:text-zinc-600"
                            placeholder="设置本页特定布局意图，例如：深色渐变背景，中央放置发光图标..."
                          />
                        </div>

                      </div>
                    )
                  })}
                </div>

                {/* 新增 PPT 幻灯片页面 */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSlide}
                    className="w-full py-6 border-dashed border-2 border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50/5 hover:text-indigo-500 transition-all gap-2 text-sm cursor-pointer"
                  >
                    <PlusIcon className="size-4" />
                    添加新的 PPT 页面
                  </Button>
                </div>
              </div>
            )}

            {/* 🚀 Tab B: 直接编辑 JSON (增加 max-h-[600px] 与 overflow-y-auto，绝不无限拖长) */}
            {outlineMode === "json" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-inner shadow-black/45">
                <OutlineEditor
                  outline={outline}
                  draft={outlineDraft}
                  error={outlineError}
                  isGenerating={isGeneratingSVG}
                  onDraftChange={setOutlineDraft}
                  onApply={handleApplyOutline}
                  onGenerateSVG={handleGenerateSVG}
                />
              </div>
            )}

          </div>
        )

      // 3. 幻灯片预览
      case "workspace.ppt":
        if (!svgs || svgs.length === 0) {
          return (
            <div className="mx-auto max-w-xl w-full">
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
            </div>
          )
        }
        
        // 幻灯片预览区域也取消嵌套 Card，整体感更强
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5 pb-1">
              <h2 className="text-lg font-bold text-foreground">幻灯片预览与导出</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                预览渲染出来的多页 SVG 幻灯片，确认效果后一键打包导出。
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 shadow-xl shadow-black/45">
              <SVGPreviewGrid
                slides={svgs}
                isExporting={isExportingPPTX}
                onExportPPTX={handleExportPPTX}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isOverview = activePage === "workspace.overview"

  return (
    <div className={compact ? "bg-background" : "min-h-svh bg-background/30"}>
      <section className={compact ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8"}>

        {error ? <DebugErrorAlert title="请求失败" error={error} /> : null}

        {/* 动态布局 */}
        {isOverview ? (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
            
            {/* 左侧角色模型状态 */}
            <Card className="h-full flex flex-col border-border/50 bg-card/60 backdrop-blur-sm shadow-sm animate-in fade-in duration-300">
              <CardHeader className="pb-3.5">
                <BotIcon className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                角色模型状态
                <CardDescription className="text-xs leading-relaxed mt-0.5">
                  系统根据后台配置自动分发任务
                </CardDescription>
              </CardHeader>
              
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

            {/* 右侧内容 */}
            <div className="min-w-0 h-full flex flex-col">
              {renderActiveStep()}
            </div>
          </div>
        ) : (
          /* B. 创作单栏视图 */
          <div className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderActiveStep()}
          </div>
        )}

      </section>
    </div>
  )
}