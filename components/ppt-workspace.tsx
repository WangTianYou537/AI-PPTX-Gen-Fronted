"use client"

import * as React from "react"
import { toast } from "sonner"
import { createOutlineJob, createSVGJob, exportPPTX } from "@/lib/api"
import { waitForJob } from "@/lib/jobs"
import type { GenerationJob, PresentationOutline, SlideOutline, SlideSVG, TopicInput } from "@/lib/types"
import type { AppPageId } from "@/lib/navigation"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { WorkspaceOverviewStep } from "@/components/workspace/overview-step"
import { WorkspaceOutlineStep } from "@/components/workspace/outline-step"
import { WorkspacePPTStep } from "@/components/workspace/ppt-step"
import { WorkspaceTopicStep } from "@/components/workspace/topic-step"
import type { WorkspaceShellProps } from "@/components/workspace/types"

const defaultTopic: TopicInput = {
  topic: "",
  audience: "本科大学生",
  slideCount: 8,
  style: "科技、简洁、视觉化",
}

function safeFilename(title: string) {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]/g, "-").slice(0, 80)
  return cleaned || "ppt-gen"
}

export function PPTWorkspace({ compact = false, activePage, onPageChange, onQuotaChange }: WorkspaceShellProps) {
  const [topic, setTopic] = React.useState<TopicInput>(defaultTopic)
  const [outline, setOutline] = React.useState<PresentationOutline | null>(null)
  const [outlineDraft, setOutlineDraft] = React.useState("")
  const [outlineError, setOutlineError] = React.useState("")
  const [svgs, setSVGs] = React.useState<SlideSVG[]>([])
  const [outlineMode, setOutlineMode] = React.useState<"visual" | "json">("visual")
  const [isArchitecting, setIsArchitecting] = React.useState(false)
  const [isGeneratingSVG, setIsGeneratingSVG] = React.useState(false)
  const [isExportingPPTX, setIsExportingPPTX] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [activeJob, setActiveJob] = React.useState<GenerationJob | null>(null)
  const pollAbortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    return () => {
      pollAbortRef.current?.abort()
    }
  }, [])

  async function handleGenerateOutline() {
    setError(null)
    setIsArchitecting(true)
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    try {
      const job = await createOutlineJob(topic)
      setActiveJob(job)
      toast.message("架构生成任务已提交，可继续浏览其他页面")
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        onUpdate: setActiveJob,
      })
      if (done.status === "failed") {
        throw new Error(done.error || "架构生成失败")
      }
      const nextOutline = done.result?.outline
      if (!nextOutline) {
        throw new Error("任务完成但未返回架构结果")
      }
      setOutline(nextOutline)
      setOutlineDraft(JSON.stringify(nextOutline, null, 2))
      setSVGs([])
      toast.success("PPT 架构已生成")
      onPageChange("workspace.outline")
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成架构失败")
    } finally {
      setIsArchitecting(false)
      setActiveJob(null)
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
      toast.error("大纲架构为空，请先生成架构")
      return
    }
    setError(null)
    setIsGeneratingSVG(true)
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    try {
      const job = await createSVGJob(outline)
      setActiveJob(job)
      toast.message("页面生成任务已提交，可自由切换页面，完成后会自动跳转预览")
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        onUpdate: setActiveJob,
      })
      if (done.status === "failed") {
        throw new Error(done.error || "页面生成失败")
      }
      const slides = done.result?.slides
      if (!slides?.length) {
        throw new Error("任务完成但未返回页面结果")
      }
      setSVGs(slides)
      if (done.result?.quota) onQuotaChange?.(done.result.quota)
      toast.success("PPT 页面已生成")
      onPageChange("workspace.ppt")
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成 页面 失败")
    } finally {
      setIsGeneratingSVG(false)
      setActiveJob(null)
    }
  }

  async function handleExportPPTX() {
    if (svgs.length === 0) return
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

  const saveVisualChanges = (newOutline: PresentationOutline) => {
    setOutline(newOutline)
    setOutlineDraft(JSON.stringify(newOutline, null, 2))
  }

  const handleUpdateTitle = (val: string) => {
    if (!outline) return
    saveVisualChanges({ ...outline, title: val })
  }

  const handleUpdateSlideField = (slideIndex: number, field: "title" | "purpose" | "visualHint", val: string) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], [field]: val }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleUpdateBullet = (slideIndex: number, bulletIndex: number, val: string) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    const updatedPoints = [...updatedSlides[slideIndex].keyPoints]
    updatedPoints[bulletIndex] = val
    updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], keyPoints: updatedPoints }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleAddBullet = (slideIndex: number) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      keyPoints: [...updatedSlides[slideIndex].keyPoints, ""],
    }
    saveVisualChanges({ ...outline, slides: updatedSlides })
  }

  const handleDeleteBullet = (slideIndex: number, bulletIndex: number) => {
    if (!outline) return
    const updatedSlides = [...outline.slides]
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      keyPoints: updatedSlides[slideIndex].keyPoints.filter((_, i) => i !== bulletIndex),
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
      visualHint: "深色极简风格，使用卡片网格布局",
    }
    saveVisualChanges({ ...outline, slides: [...outline.slides, newSlide] })
  }

  const handleDeleteSlide = (slideIndex: number) => {
    if (!outline) return
    const filtered = outline.slides.filter((_, i) => i !== slideIndex)
    const reindexed = filtered.map((slide, index) => ({ ...slide, id: `slide-${index + 1}` }))
    saveVisualChanges({ ...outline, slides: reindexed })
  }

  const handleTabChange = (mode: "visual" | "json") => {
    if (mode === "visual") {
      try {
        const parsed = JSON.parse(outlineDraft) as PresentationOutline
        if (!parsed.title || !Array.isArray(parsed.slides)) throw new Error("格式不完整")
        setOutline(parsed)
        setOutlineError("")
      } catch {
        toast.error("JSON 语法有误，请修复后切换。")
        return
      }
    }
    setOutlineMode(mode)
  }

  function renderActiveStep(page: AppPageId) {
    switch (page) {
      case "workspace.overview":
        return <WorkspaceOverviewStep onPageChange={onPageChange} />
      case "workspace.topic":
        return (
          <WorkspaceTopicStep
            topic={topic}
            isLoading={isArchitecting}
            onChange={setTopic}
            onSubmit={handleGenerateOutline}
          />
        )
      case "workspace.outline":
        return (
          <WorkspaceOutlineStep
            topic={topic}
            outline={outline}
            outlineDraft={outlineDraft}
            outlineError={outlineError}
            outlineMode={outlineMode}
            isGeneratingSVG={isGeneratingSVG}
            onPageChange={onPageChange}
            onDraftChange={setOutlineDraft}
            onApply={handleApplyOutline}
            onGenerateSVG={handleGenerateSVG}
            onTabChange={handleTabChange}
            onUpdateTitle={handleUpdateTitle}
            onUpdateSlideField={handleUpdateSlideField}
            onUpdateBullet={handleUpdateBullet}
            onAddBullet={handleAddBullet}
            onDeleteBullet={handleDeleteBullet}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
          />
        )
      case "workspace.ppt":
        return (
          <WorkspacePPTStep
            outline={outline}
            svgs={svgs}
            isExportingPPTX={isExportingPPTX}
            onPageChange={onPageChange}
            onExportPPTX={handleExportPPTX}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={compact ? "bg-background" : "min-h-svh bg-background/30"}>
      <section className={compact ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8"}>
        {activeJob ? (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                后台任务进行中：{activeJob.type === "outline" ? "生成架构" : "生成页面"} · {activeJob.status}
                {typeof activeJob.progress === "number" ? ` · ${activeJob.progress}%` : ""}
              </span>
              <span className="text-xs text-indigo-200/80">可切换到其他页面，完成后会自动更新结果</span>
            </div>
          </div>
        ) : null}
        {error ? <DebugErrorAlert title="请求失败" error={error} /> : null}
        <div className="min-w-0 w-full animate-in fade-in duration-300">
          {renderActiveStep(activePage)}
        </div>
      </section>
    </div>
  )
}
