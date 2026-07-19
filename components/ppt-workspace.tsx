"use client"

import * as React from "react"
import { toast } from "sonner"
import { createOutlineJob, createSVGJob, exportPPTX, getJob, listJobs, saveOutlineJobResult } from "@/lib/api"
import { waitForJob } from "@/lib/jobs"
import { clearActiveJob, loadActiveJob, saveActiveJob } from "@/lib/job-session"
import { isValidOutline, loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspace-session"
import type { EffectiveQuota, GenerationJob, PresentationOutline, SlideOutline, SlideSVG, TopicInput } from "@/lib/types"
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
  notes: "",
  uploadIds: [],
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
  const [regeneratingId, setRegeneratingId] = React.useState<string | null>(null)
  const [revisingId, setRevisingId] = React.useState<string | null>(null)
  const [batchRetrying, setBatchRetrying] = React.useState(false)
  const [batchRetryProgress, setBatchRetryProgress] = React.useState<{ done: number; total: number; current?: string } | null>(null)
  const [error, setError] = React.useState<unknown>(null)
  const [activeJob, setActiveJob] = React.useState<GenerationJob | null>(null)
  const pollAbortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    return () => {
      pollAbortRef.current?.abort()
    }
  }, [])

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- only hydrate when user explicitly opened a job result */
    try {
      // Do NOT auto-load previous workspace draft on entry.
      // Only restore when user actively opens a result from the task list/detail page
      // (which writes a one-shot sessionStorage handoff).
      const outlineRaw = window.sessionStorage.getItem("ppt-gen:last-outline-result")
      if (outlineRaw) {
        const parsed = JSON.parse(outlineRaw) as { outline?: PresentationOutline; jobId?: string }
        if (parsed.outline?.title && Array.isArray(parsed.outline.slides)) {
          setOutline(parsed.outline)
          setOutlineDraft(JSON.stringify(parsed.outline, null, 2))
          saveWorkspaceDraft({
            outline: parsed.outline,
            outlineDraft: JSON.stringify(parsed.outline, null, 2),
            lastOutlineJobId: parsed.jobId,
          })
        }
        window.sessionStorage.removeItem("ppt-gen:last-outline-result")
      }
      const svgRaw = window.sessionStorage.getItem("ppt-gen:last-svg-result")
      if (svgRaw) {
        const parsed = JSON.parse(svgRaw) as {
          slides?: SlideSVG[]
          quota?: EffectiveQuota
          outline?: PresentationOutline
          jobId?: string
        }
        if (parsed.outline?.title && Array.isArray(parsed.outline.slides)) {
          setOutline(parsed.outline)
          setOutlineDraft(JSON.stringify(parsed.outline, null, 2))
          saveWorkspaceDraft({
            outline: parsed.outline,
            outlineDraft: JSON.stringify(parsed.outline, null, 2),
            lastSvgJobId: parsed.jobId,
          })
        }
        if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setSVGs(parsed.slides)
          saveWorkspaceDraft({ svgs: parsed.slides, lastSvgJobId: parsed.jobId })
          if (parsed.quota) onQuotaChange?.(parsed.quota)
        }
        window.sessionStorage.removeItem("ppt-gen:last-svg-result")
      }
    } catch {
      // ignore bad cache
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, [])

  // Persist draft only when user has real content, so empty default entry won't clobber saved work
  // and so regenerate can still recover outline without auto-restoring UI on next visit.
  React.useEffect(() => {
    const hasTopic = Boolean(topic.topic?.trim())
    const hasOutline = Boolean(outline && outline.slides?.length)
    const hasSvgs = svgs.length > 0
    if (!hasTopic && !hasOutline && !hasSvgs) return
    saveWorkspaceDraft({
      topic: hasTopic ? topic : undefined,
      outline: hasOutline ? outline : undefined,
      outlineDraft: hasOutline ? outlineDraft : undefined,
      svgs: hasSvgs ? svgs : undefined,
    })
  }, [topic, outline, outlineDraft, svgs])

  React.useEffect(() => {
    let cancelled = false
    async function resume() {
      const session = loadActiveJob()
      if (!session) return
      pollAbortRef.current?.abort()
      const controller = new AbortController()
      pollAbortRef.current = controller
      try {
        if (session.type === "outline") setIsArchitecting(true)
        else setIsGeneratingSVG(true)
        setActiveJob({
          id: session.jobId,
          userId: "",
          type: session.type,
          status: "running",
          progress: 0,
          createdAt: session.createdAt,
          updatedAt: session.createdAt,
        })
        toast.message("检测到未完成的后台任务，正在恢复…")
        const done = await waitForJob(session.jobId, {
          signal: controller.signal,
          jobType: session.type,
          onUpdate: (job) => {
            if (!cancelled) setActiveJob(job)
          },
          onSoftTimeout: () => {
            if (!cancelled) toast.message("任务仍在后台运行，页面会继续等待…")
          },
        })
        if (cancelled) return
        if (done.status === "failed") {
          clearActiveJob()
          throw new Error(done.error || "后台任务失败")
        }
        if (done.type === "outline") {
          const nextOutline = done.result?.outline
          if (!nextOutline) throw new Error("任务完成但未返回架构结果")
          setOutline(nextOutline)
          setOutlineDraft(JSON.stringify(nextOutline, null, 2))
          setSVGs([])
          toast.success("已恢复并完成架构生成")
          onPageChange("workspace.outline")
        } else {
          const slides = done.result?.slides
          if (!slides?.length) throw new Error("任务完成但未返回页面结果")
          setSVGs(slides)
          if (done.result?.quota) onQuotaChange?.(done.result.quota)
          const failed = slides.filter((s) => s.error || !s.svg).length
          if (failed > 0) toast.warning(`已恢复生成结果：成功 ${slides.length - failed} 页，失败 ${failed} 页`)
          else toast.success("已恢复并完成页面生成")
          onPageChange("workspace.ppt")
        }
        clearActiveJob()
      } catch (err) {
        if (err instanceof Error && err.message === "任务轮询已取消") return
        clearActiveJob()
        setError(err)
        toast.error(err instanceof Error ? err.message : "恢复后台任务失败")
      } finally {
        if (!cancelled) {
          setIsArchitecting(false)
          setIsGeneratingSVG(false)
          setActiveJob(null)
        }
      }
    }
    void resume()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume once on mount
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
      saveActiveJob({ jobId: job.id, type: "outline", createdAt: job.createdAt || new Date().toISOString() })
      saveWorkspaceDraft({ topic, lastOutlineJobId: job.id })
      toast.message("架构生成任务已提交，关闭浏览器后也可回来继续查看")
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        jobType: "outline",
        onUpdate: setActiveJob,
        onSoftTimeout: () => toast.message("架构生成时间较长，仍在后台运行…"),
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
      saveWorkspaceDraft({
        topic,
        outline: nextOutline,
        outlineDraft: JSON.stringify(nextOutline, null, 2),
        svgs: [],
        lastOutlineJobId: job.id,
      })
      clearActiveJob()
      toast.success("PPT 架构已生成")
      onPageChange("workspace.outline")
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      clearActiveJob()
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成架构失败")
    } finally {
      setIsArchitecting(false)
      setActiveJob(null)
    }
  }

  async function handleApplyOutline() {
    try {
      const parsed = JSON.parse(outlineDraft) as PresentationOutline
      if (!parsed.title || !Array.isArray(parsed.slides)) {
        throw new Error("必须包含 title 和 slides")
      }
      setOutline(parsed)
      setOutlineError("")
      const draft = loadWorkspaceDraft()
      saveWorkspaceDraft({
        topic,
        outline: parsed,
        outlineDraft: JSON.stringify(parsed, null, 2),
        svgs, // keep current pages; user may regenerate later
        lastOutlineJobId: draft?.lastOutlineJobId,
        lastSvgJobId: draft?.lastSvgJobId,
      })
      // Persist into outline job so task list opens the edited version.
      if (draft?.lastOutlineJobId) {
        try {
          await saveOutlineJobResult(draft.lastOutlineJobId, parsed)
          toast.success("架构修改已保存（本地 + 任务结果）")
        } catch (err) {
          toast.warning(
            `架构已保存到本地，但同步任务失败：${err instanceof Error ? err.message : "未知错误"}。从任务列表打开时将优先使用本地修改。`,
          )
        }
      } else {
        toast.success("架构修改已保存到本地")
      }
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
      saveActiveJob({ jobId: job.id, type: "svg", createdAt: job.createdAt || new Date().toISOString() })
      saveWorkspaceDraft({ outline, outlineDraft: outlineDraft || JSON.stringify(outline, null, 2), lastSvgJobId: job.id })
      toast.message("页面生成任务已提交，关闭浏览器后也可回来继续查看")
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        jobType: "svg",
        onUpdate: setActiveJob,
        onSoftTimeout: () => toast.message("页面生成时间较长，仍在后台运行，可关闭浏览器稍后回来查看…"),
      })
      if (done.status === "failed") {
        throw new Error(done.error || "页面生成失败")
      }
      const slides = done.result?.slides
      if (!slides?.length) {
        throw new Error("任务完成但未返回页面结果")
      }
      setSVGs(slides)
      if (done.result?.outline && isValidOutline(done.result.outline)) {
        setOutline(done.result.outline)
        setOutlineDraft(JSON.stringify(done.result.outline, null, 2))
        saveWorkspaceDraft({
          outline: done.result.outline,
          outlineDraft: JSON.stringify(done.result.outline, null, 2),
          svgs: slides,
          lastSvgJobId: done.id,
        })
      } else {
        saveWorkspaceDraft({ outline, outlineDraft, svgs: slides, lastSvgJobId: done.id })
      }
      if (done.result?.quota) onQuotaChange?.(done.result.quota)
      const failed = slides.filter((s) => s.error || !s.svg).length
      if (failed > 0) {
        toast.warning(`页面生成完成：成功 ${slides.length - failed} 页，失败 ${failed} 页，可在预览中重试失败页`)
      } else {
        toast.success("PPT 页面已生成")
      }
      clearActiveJob()
      onPageChange("workspace.ppt")
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      clearActiveJob()
      setError(err)
      toast.error(err instanceof Error ? err.message : "生成 页面 失败")
    } finally {
      setIsGeneratingSVG(false)
      setActiveJob(null)
    }
  }


  async function resolveOutlineForRetry(): Promise<PresentationOutline | null> {
    // 1) in-memory
    if (isValidOutline(outline)) return outline

    // 2) local draft
    const draft = loadWorkspaceDraft()
    if (isValidOutline(draft?.outline)) {
      setOutline(draft!.outline!)
      setOutlineDraft(draft?.outlineDraft || JSON.stringify(draft!.outline, null, 2))
      return draft!.outline!
    }

    // 3) outlineDraft JSON
    if (outlineDraft.trim()) {
      try {
        const parsed = JSON.parse(outlineDraft) as PresentationOutline
        if (isValidOutline(parsed)) {
          setOutline(parsed)
          return parsed
        }
      } catch {
        // ignore
      }
    }

    // 4) last svg/outline job result from server
    try {
      if (draft?.lastSvgJobId) {
        const job = await getJob(draft.lastSvgJobId)
        if (isValidOutline(job.result?.outline)) {
          setOutline(job.result!.outline!)
          setOutlineDraft(JSON.stringify(job.result!.outline, null, 2))
          saveWorkspaceDraft({ outline: job.result!.outline, outlineDraft: JSON.stringify(job.result!.outline, null, 2) })
          return job.result!.outline!
        }
      }
      if (draft?.lastOutlineJobId) {
        const job = await getJob(draft.lastOutlineJobId)
        if (isValidOutline(job.result?.outline)) {
          setOutline(job.result!.outline!)
          setOutlineDraft(JSON.stringify(job.result!.outline, null, 2))
          saveWorkspaceDraft({ outline: job.result!.outline, outlineDraft: JSON.stringify(job.result!.outline, null, 2) })
          return job.result!.outline!
        }
      }
      const listed = await listJobs()
      for (const job of listed.jobs || []) {
        if (isValidOutline(job.result?.outline)) {
          setOutline(job.result!.outline!)
          setOutlineDraft(JSON.stringify(job.result!.outline, null, 2))
          saveWorkspaceDraft({
            outline: job.result!.outline,
            outlineDraft: JSON.stringify(job.result!.outline, null, 2),
            lastSvgJobId: job.type === "svg" ? job.id : draft?.lastSvgJobId,
            lastOutlineJobId: job.type === "outline" ? job.id : draft?.lastOutlineJobId,
          })
          return job.result!.outline!
        }
      }
    } catch {
      // ignore network errors here; caller will show message
    }
    return null
  }

  async function enqueueSlideJob(options: {
    slideIds: string[]
    instruction?: string
    currentSvg?: string
    toastStart: string
  }) {
    const currentOutline = await resolveOutlineForRetry()
    if (!currentOutline) {
      toast.error("缺少完整大纲，无法后台重试。请先回到架构页确认大纲。")
      return null
    }
    for (const id of options.slideIds) {
      if (!currentOutline.slides.some((s) => s.id === id)) {
        toast.error(`大纲中找不到 ${id}`)
        return null
      }
    }
    const draft = loadWorkspaceDraft()
    const parentJobId = draft?.lastSvgJobId || ""
    const job = await createSVGJob(currentOutline, {
      slideIds: options.slideIds,
      parentJobId,
      existingSlides: svgs,
      instruction: options.instruction || "",
      currentSvg: options.currentSvg || "",
    })
    // Track the running child for polling, but keep parent id for result identity.
    saveActiveJob({ jobId: job.id, type: "svg", createdAt: job.createdAt || new Date().toISOString() })
    saveWorkspaceDraft({
      outline: currentOutline,
      outlineDraft: JSON.stringify(currentOutline, null, 2),
      svgs,
      lastSvgJobId: parentJobId || job.id,
    })
    setActiveJob(job)
    toast.message(options.toastStart)
    return job
  }

  async function watchSlideJob(jobId: string, quiet = false) {
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    setIsGeneratingSVG(true)
    try {
      const done = await waitForJob(jobId, {
        signal: controller.signal,
        jobType: "svg",
        onUpdate: setActiveJob,
        onSoftTimeout: () => {
          if (!quiet) toast.message("后台仍在生成，可离开此页，稍后在任务列表查看")
        },
      })
      if (done.status === "failed") {
        // Still apply partial slides if present.
        const slides = done.result?.slides
        if (Array.isArray(slides) && slides.length > 0) {
          setSVGs(slides)
          if (done.result?.outline && isValidOutline(done.result.outline)) {
            setOutline(done.result.outline)
            setOutlineDraft(JSON.stringify(done.result.outline, null, 2))
          }
          saveWorkspaceDraft({
            outline: done.result?.outline || outline,
            outlineDraft: done.result?.outline ? JSON.stringify(done.result.outline, null, 2) : outlineDraft,
            svgs: slides,
            lastSvgJobId: loadWorkspaceDraft()?.lastSvgJobId || done.id,
          })
        }
        if (done.result?.quota) onQuotaChange?.(done.result.quota)
        clearActiveJob()
        const failed = (slides || []).filter((s) => s.error || !s.svg).length
        if (failed > 0) toast.warning(done.error || `后台重试结束：仍有 ${failed} 页失败`)
        else toast.error(done.error || "后台重试失败")
        return
      }
      const slides = done.result?.slides
      if (!slides?.length) {
        clearActiveJob()
        toast.error("任务完成但未返回页面结果")
        return
      }
      setSVGs(slides)
      if (done.result?.outline && isValidOutline(done.result.outline)) {
        setOutline(done.result.outline)
        setOutlineDraft(JSON.stringify(done.result.outline, null, 2))
        saveWorkspaceDraft({
          outline: done.result.outline,
          outlineDraft: JSON.stringify(done.result.outline, null, 2),
          svgs: slides,
          lastSvgJobId: done.result ? (loadWorkspaceDraft()?.lastSvgJobId || done.id) : done.id,
        })
      } else {
        saveWorkspaceDraft({ outline, outlineDraft, svgs: slides, lastSvgJobId: loadWorkspaceDraft()?.lastSvgJobId || done.id })
      }
      // Prefer parent job id for subsequent opens if present in draft already
      const draft = loadWorkspaceDraft()
      if (draft?.lastSvgJobId) {
        saveWorkspaceDraft({ svgs: slides, lastSvgJobId: draft.lastSvgJobId })
      }
      if (done.result?.quota) onQuotaChange?.(done.result.quota)
      const failed = slides.filter((s) => s.error || !s.svg).length
      if (failed > 0) toast.warning(`后台重试完成：成功 ${slides.length - failed} 页，失败 ${failed} 页`)
      else toast.success("后台重试完成，页面已更新")
      clearActiveJob()
      onPageChange("workspace.ppt")
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      // Keep active job so user can resume later from task list.
      if (!quiet) toast.message("已转后台运行，可离开页面，稍后在任务列表查看")
    } finally {
      setIsGeneratingSVG(false)
      setActiveJob(null)
      setRegeneratingId(null)
      setRevisingId(null)
      setBatchRetrying(false)
      setBatchRetryProgress(null)
    }
  }

  async function handleRegenerateSlide(slideId: string) {
    if (batchRetrying || isGeneratingSVG || revisingId) {
      toast.message("已有生成任务进行中，请稍候或到任务列表查看")
      return
    }
    setError(null)
    setRegeneratingId(slideId)
    try {
      const job = await enqueueSlideJob({
        slideIds: [slideId],
        toastStart: `已提交 ${slideId} 后台重试，可离开页面`,
      })
      if (!job) return
      // Fire-and-watch without blocking leave: user can navigate away; cleanup aborts only this watcher.
      void watchSlideJob(job.id)
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "提交后台重试失败")
      setRegeneratingId(null)
    }
  }

  async function handleRegenerateFailedSlides() {
    if (batchRetrying || isGeneratingSVG || revisingId) {
      toast.message("已有生成任务进行中，请稍候或到任务列表查看")
      return
    }
    const failedIds = svgs.filter((s) => s.error || !s.svg).map((s) => s.slideId).filter(Boolean)
    if (failedIds.length === 0) {
      toast.message("没有失败页面需要重试")
      return
    }
    setError(null)
    setBatchRetrying(true)
    setBatchRetryProgress({ done: 0, total: failedIds.length })
    try {
      const job = await enqueueSlideJob({
        slideIds: failedIds,
        toastStart: `已提交 ${failedIds.length} 个失败页后台重试，可离开页面`,
      })
      if (!job) {
        setBatchRetrying(false)
        setBatchRetryProgress(null)
        return
      }
      void watchSlideJob(job.id)
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "提交批量后台重试失败")
      setBatchRetrying(false)
      setBatchRetryProgress(null)
    }
  }

  async function handleReviseSlide(slideId: string, instruction: string, currentSvg: string) {
    if (batchRetrying || isGeneratingSVG || regeneratingId) {
      toast.message("已有生成任务进行中，请稍候或到任务列表查看")
      return
    }
    if (!instruction.trim()) {
      toast.error("请先填写修改要求")
      return
    }
    setError(null)
    setRevisingId(slideId)
    try {
      const job = await enqueueSlideJob({
        slideIds: [slideId],
        instruction: instruction.trim(),
        currentSvg,
        toastStart: `已提交 ${slideId} AI 修改到后台，可离开页面`,
      })
      if (!job) {
        setRevisingId(null)
        return
      }
      void watchSlideJob(job.id)
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "提交 AI 修改失败")
      setRevisingId(null)
    }
  }

  async function handleExportPPTX() {
    const exportable = svgs.filter((s) => s.svg && !s.error)
    if (exportable.length === 0) {
      toast.error("没有可导出的成功页面")
      return
    }
    setIsExportingPPTX(true)
    try {
      const title = outline?.title || "ppt-gen"
      const blob = await exportPPTX(title, exportable)
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
    const draftText = JSON.stringify(newOutline, null, 2)
    setOutlineDraft(draftText)
    const draft = loadWorkspaceDraft()
    saveWorkspaceDraft({
      topic,
      outline: newOutline,
      outlineDraft: draftText,
      svgs,
      lastOutlineJobId: draft?.lastOutlineJobId,
      lastSvgJobId: draft?.lastSvgJobId,
    })
    // Fire-and-forget sync to outline job so task list keeps latest edits.
    if (draft?.lastOutlineJobId) {
      void saveOutlineJobResult(draft.lastOutlineJobId, newOutline).catch(() => {
        // local draft remains source of truth if sync fails
      })
    }
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
            regeneratingId={regeneratingId}
            revisingId={revisingId}
            batchRetrying={batchRetrying}
            batchRetryProgress={batchRetryProgress}
            onRegenerateSlide={handleRegenerateSlide}
            onRegenerateFailedSlides={handleRegenerateFailedSlides}
            onReviseSlide={handleReviseSlide}
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
                <span className="ml-2 font-mono text-[11px] opacity-70">#{activeJob.id.slice(0, 8)}</span>
              </span>
              <span className="text-xs text-indigo-200/80">可关闭浏览器，稍后回来会自动恢复任务状态</span>
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
