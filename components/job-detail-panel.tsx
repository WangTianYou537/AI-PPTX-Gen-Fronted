"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getJob } from "@/lib/api"
import { waitForJob } from "@/lib/jobs"
import { clearActiveJob, saveActiveJob } from "@/lib/job-session"
import { loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspace-session"
import type { GenerationJob, PresentationOutline, SlideSVG } from "@/lib/types"
import { pageIdToPath } from "@/lib/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  PlayCircleIcon,
  RefreshCcwIcon,
  SkipForwardIcon,
  XCircleIcon,
} from "lucide-react"

function statusBadge(status: GenerationJob["status"]) {
  switch (status) {
    case "queued":
      return <Badge variant="outline">排队中</Badge>
    case "running":
      return <Badge>运行中</Badge>
    case "succeeded":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">成功</Badge>
    case "failed":
      return <Badge variant="destructive">失败</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function typeLabel(type: GenerationJob["type"]) {
  return type === "outline" ? "架构生成（Agent）" : "页面生成"
}

function formatTime(value?: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function kindLabel(kind: string) {
  switch (kind) {
    case "vision":
      return "视觉理解"
    case "search":
      return "联网检索"
    case "summarize":
      return "上下文汇总"
    case "outline":
      return "大纲生成"
    default:
      return kind
  }
}

export function JobDetailPanel({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [job, setJob] = React.useState<GenerationJob | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const pollAbortRef = React.useRef<AbortController | null>(null)

  async function load() {
    if (!jobId) {
      setLoading(false)
      setError("缺少任务 ID")
      return
    }
    setLoading(true)
    setError("")
    try {
      const latest = await getJob(jobId)
      setJob(latest)
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载任务失败"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch detail on mount/id change
    void load()
    if (!jobId) return
    const timer = window.setInterval(() => {
      void getJob(jobId)
        .then((latest) => setJob(latest))
        .catch(() => {})
    }, 4000)
    return () => {
      window.clearInterval(timer)
      pollAbortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when jobId changes
  }, [jobId])

  if (!jobId) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">缺少任务 ID，请从任务列表进入。</p>
          <Button variant="outline" onClick={() => router.push(pageIdToPath("workspace.jobs"))}>
            <ArrowLeftIcon data-icon="inline-start" /> 返回任务列表
          </Button>
        </CardContent>
      </Card>
    )
  }
  async function applyJobResult(target: GenerationJob) {
    if (target.type === "outline") {
      let outline = target.result?.outline as PresentationOutline | undefined
      const draft = loadWorkspaceDraft()
      if (draft?.lastOutlineJobId === target.id && draft.outline?.title && Array.isArray(draft.outline.slides)) {
        outline = draft.outline
      }
      if (!outline) throw new Error("任务没有可恢复的大纲结果")
      saveWorkspaceDraft({
        outline,
        outlineDraft: JSON.stringify(outline, null, 2),
        lastOutlineJobId: target.id,
      })
      window.sessionStorage.setItem(
        "ppt-gen:last-outline-result",
        JSON.stringify({ outline, jobId: target.id, at: new Date().toISOString() }),
      )
      toast.success("已载入最新架构（含本地修改）")
      router.push(pageIdToPath("workspace.outline"))
      return
    }
    let slides = target.result?.slides as SlideSVG[] | undefined
    let outline = target.result?.outline
    const draft = loadWorkspaceDraft()
    if (draft?.lastSvgJobId === target.id && Array.isArray(draft.svgs) && draft.svgs.length > 0) {
      slides = draft.svgs
      if (draft.outline) outline = draft.outline
    }
    if (!slides?.length) throw new Error("任务没有可恢复的页面结果")
    saveWorkspaceDraft({
      outline: outline || draft?.outline || null,
      outlineDraft: outline ? JSON.stringify(outline, null, 2) : draft?.outlineDraft,
      svgs: slides,
      lastSvgJobId: target.id,
    })
    window.sessionStorage.setItem(
      "ppt-gen:last-svg-result",
      JSON.stringify({ slides, outline, quota: target.result?.quota, jobId: target.id, at: new Date().toISOString() }),
    )
    toast.success("已载入页面结果")
    router.push(pageIdToPath("workspace.ppt"))
  }

  async function handleContinue() {
    if (!job) return
    setBusy(true)
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    try {
      saveActiveJob({ jobId: job.id, type: job.type, createdAt: job.createdAt })
      toast.message("继续等待任务…")
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        jobType: job.type,
        onUpdate: setJob,
        onSoftTimeout: () => toast.message("任务仍在运行，详情页会持续刷新…"),
      })
      if (done.status === "failed") {
        clearActiveJob()
        toast.error(done.error || "任务失败")
        return
      }
      clearActiveJob()
      await applyJobResult(done)
    } catch (err) {
      if (err instanceof Error && err.message === "任务轮询已取消") return
      toast.error(err instanceof Error ? err.message : "继续等待失败")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !job) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2Icon className="animate-spin" /> 正在加载任务详情…
        </CardContent>
      </Card>
    )
  }

  if (error && !job) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push(pageIdToPath("workspace.jobs"))}>
            <ArrowLeftIcon data-icon="inline-start" /> 返回任务列表
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!job) return null

  const traces = job.result?.traces || []
  const isActive = job.status === "queued" || job.status === "running"
  const isSuccess = job.status === "succeeded"
  const isFailed = job.status === "failed"
  const failedSlides = (job.result?.slides || []).filter((s) => s.error || !s.svg)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{typeLabel(job.type)}</CardTitle>
              {statusBadge(job.status)}
              <Badge variant="secondary">{job.progress ?? 0}%</Badge>
              <span className="font-mono text-xs text-muted-foreground">#{job.id}</span>
            </div>
            <CardDescription>
              创建 {formatTime(job.createdAt)} · 更新 {formatTime(job.updatedAt)}
              {job.startedAt ? ` · 开始 ${formatTime(job.startedAt)}` : ""}
              {job.finishedAt ? ` · 结束 ${formatTime(job.finishedAt)}` : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(pageIdToPath("workspace.jobs"))}>
              <ArrowLeftIcon data-icon="inline-start" /> 返回列表
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={busy}>
              <RefreshCcwIcon data-icon="inline-start" /> 刷新
            </Button>
            {isActive ? (
              <Button onClick={() => void handleContinue()} disabled={busy}>
                {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <PlayCircleIcon data-icon="inline-start" />}
                继续等待
              </Button>
            ) : null}
            {isSuccess || (job.type === "svg" && failedSlides.length > 0) || (job.type === "outline" && job.result?.outline) ? (
              <Button
                onClick={() =>
                  void applyJobResult(job).catch((err) =>
                    toast.error(err instanceof Error ? err.message : "打开结果失败"),
                  )
                }
                disabled={busy}
              >
                <CheckCircle2Icon data-icon="inline-start" />
                打开结果
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFailed && job.error ? (
            <Alert variant="destructive">
              <XCircleIcon />
              <AlertTitle>任务失败</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap break-all">{job.error}</AlertDescription>
            </Alert>
          ) : null}
          {isActive ? (
            <Alert>
              <Clock3Icon />
              <AlertTitle>任务进行中</AlertTitle>
              <AlertDescription>Agent 步骤会在完成后写入 traces。本页每 4 秒自动刷新。</AlertDescription>
            </Alert>
          ) : null}
          {job.result?.context ? (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-sm font-medium">汇总 Context</p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-word text-xs leading-relaxed">
                {job.result.context}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {(job.children && job.children.length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">子任务（重试 / AI 修改）</CardTitle>
            <CardDescription>这些操作挂在当前任务下，不会在任务列表单独占一行。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.children.map((child) => (
              <div key={child.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{child.label || (child.type === "svg" ? "页面子任务" : child.type)}</span>
                  {statusBadge(child.status)}
                  <Badge variant="secondary">{child.progress ?? 0}%</Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">#{child.id.slice(0, 10)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  创建 {formatTime(child.createdAt)} · 更新 {formatTime(child.updatedAt)}
                </p>
                {child.error ? <p className="mt-1 text-xs text-destructive break-all">{child.error}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent 步骤 Traces</CardTitle>
          <CardDescription>
            {job.type === "outline"
              ? "展示架构师 Agent 的 vision / search / summarize / outline 执行轨迹。"
              : "页面生成任务通常没有 Agent traces；可查看页面失败详情。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.type === "outline" && traces.length === 0 ? (
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>暂无 traces</AlertTitle>
              <AlertDescription>
                任务尚未写入步骤轨迹。若是旧任务或未启用 Agent workflow，这里会为空。
              </AlertDescription>
            </Alert>
          ) : null}

          {traces.map((trace, index) => {
            const failed = Boolean(trace.error)
            const skipped = Boolean(trace.skipped)
            return (
              <div
                key={`${trace.id}-${index}`}
                className={`rounded-xl border p-4 ${failed ? "border-destructive/40 bg-destructive/5" : skipped ? "bg-muted/20" : "bg-card"}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <p className="font-medium">{trace.name || kindLabel(trace.kind)}</p>
                  <Badge variant="secondary">{kindLabel(trace.kind)}</Badge>
                  {skipped ? (
                    <Badge variant="outline">
                      <SkipForwardIcon className="mr-1 size-3" /> 已跳过
                    </Badge>
                  ) : failed ? (
                    <Badge variant="destructive">失败</Badge>
                  ) : (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">完成</Badge>
                  )}
                  <span className="font-mono text-[11px] text-muted-foreground">{trace.id}</span>
                </div>
                {skipped && trace.reason ? (
                  <p className="text-sm text-muted-foreground">原因：{trace.reason}</p>
                ) : null}
                {failed && trace.error ? (
                  <p className="text-sm text-destructive break-all whitespace-pre-wrap">{trace.error}</p>
                ) : null}
                {!skipped && !failed && trace.output ? (
                  <pre className="mt-2 max-h-56 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
                    {trace.output}
                  </pre>
                ) : null}
              </div>
            )
          })}

          {job.type === "svg" && failedSlides.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">页面失败详情（{failedSlides.length}）</p>
              {failedSlides.map((s) => (
                <div key={s.slideId} className="rounded-lg border border-destructive/30 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs">{s.slideId}</span>
                    <span className="text-muted-foreground">{s.title}</span>
                  </div>
                  <p className="text-destructive break-all">{s.error || "生成失败"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
