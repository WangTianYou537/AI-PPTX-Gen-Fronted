"use client"

import * as React from "react"
import { toast } from "sonner"
import { getJob, listJobs } from "@/lib/api"
import { waitForJob } from "@/lib/jobs"
import { clearActiveJob, saveActiveJob } from "@/lib/job-session"
import { loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspace-session"
import type { GenerationJob, PresentationOutline, SlideSVG } from "@/lib/types"
import { pageIdToPath } from "@/lib/navigation"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  PlayCircleIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
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
  return type === "outline" ? "架构生成" : "页面生成"
}

function formatTime(value?: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function slideFailures(job: GenerationJob): Array<{ slideId: string; title?: string; error: string }> {
  const slides = job.result?.slides
  if (!Array.isArray(slides)) return []
  return slides
    .filter((s) => Boolean(s?.error) || !s?.svg)
    .map((s) => ({
      slideId: s.slideId || "unknown",
      title: s.title,
      error: s.error || "生成失败（无 SVG）",
    }))
}

export function JobListPanel() {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<GenerationJob[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const pollAbortRef = React.useRef<AbortController | null>(null)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await listJobs()
      setJobs(res.jobs || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载任务失败"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch + polling for live job status
    void load()
    const timer = window.setInterval(() => {
      void load()
    }, 5000)
    return () => {
      window.clearInterval(timer)
      pollAbortRef.current?.abort()
    }
  }, [])

  async function applyJobResult(job: GenerationJob) {
    if (job.type === "outline") {
      let outline = job.result?.outline as PresentationOutline | undefined
      const draft = loadWorkspaceDraft()
      // Prefer local edited outline when it belongs to this outline job.
      if (draft?.lastOutlineJobId === job.id && draft.outline?.title && Array.isArray(draft.outline.slides)) {
        outline = draft.outline
      }
      if (!outline) throw new Error("任务没有可恢复的大纲结果")
      saveWorkspaceDraft({
        outline,
        outlineDraft: JSON.stringify(outline, null, 2),
        lastOutlineJobId: job.id,
      })
      window.sessionStorage.setItem(
        "ppt-gen:last-outline-result",
        JSON.stringify({ outline, jobId: job.id, at: new Date().toISOString() }),
      )
      toast.success("已载入最新架构（含本地修改）")
      router.push(pageIdToPath("workspace.outline"))
      return
    }
    let slides = job.result?.slides as SlideSVG[] | undefined
    let outline = job.result?.outline
    // Prefer latest local draft if it belongs to the same job (covers post-job single/batch retries).
    const draft = loadWorkspaceDraft()
    if (draft?.lastSvgJobId === job.id && Array.isArray(draft.svgs) && draft.svgs.length > 0) {
      slides = draft.svgs
      if (draft.outline) outline = draft.outline
    }
    if (!slides?.length) throw new Error("任务没有可恢复的页面结果（无每页详情）")
    // Keep draft/job id aligned for subsequent retries.
    saveWorkspaceDraft({
      outline: outline || draft?.outline || null,
      outlineDraft: outline ? JSON.stringify(outline, null, 2) : draft?.outlineDraft,
      svgs: slides,
      lastSvgJobId: job.id,
    })
    window.sessionStorage.setItem(
      "ppt-gen:last-svg-result",
      JSON.stringify({ slides, outline, quota: job.result?.quota, jobId: job.id, at: new Date().toISOString() }),
    )
    const failed = slides.filter((s) => s.error || !s.svg).length
    if (failed > 0) toast.warning(`已载入页面结果：成功 ${slides.length - failed} 页，失败 ${failed} 页`)
    else toast.success("已载入页面结果，正在跳转预览页")
    router.push(pageIdToPath("workspace.ppt"))
  }

  async function handleContinue(job: GenerationJob) {
    setBusyId(job.id)
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    try {
      saveActiveJob({ jobId: job.id, type: job.type, createdAt: job.createdAt })
      toast.message(`继续等待任务 #${job.id.slice(0, 8)}…`)
      const done = await waitForJob(job.id, {
        signal: controller.signal,
        jobType: job.type,
        onSoftTimeout: () => toast.message("任务仍在后台运行，列表会继续刷新…"),
        onUpdate: (next) => {
          setJobs((current) => current.map((item) => (item.id === next.id ? next : item)))
        },
      })
      await load()
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
      setBusyId(null)
    }
  }

  async function handleOpenResult(job: GenerationJob) {
    setBusyId(job.id)
    try {
      // refresh once for latest result payload
      const latest = await getJob(job.id)
      const hasSlides = Array.isArray(latest.result?.slides) && latest.result!.slides!.length > 0
      if (latest.status !== "succeeded" && !(latest.type === "svg" && hasSlides)) {
        toast.error(latest.error || "任务尚未成功完成")
        return
      }
      await applyJobResult(latest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "打开结果失败")
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = jobs.filter((j) => j.status === "queued" || j.status === "running").length
  const failedCount = jobs.filter((j) => j.status === "failed").length

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>
            查看后台生成任务状态与错误。关闭浏览器后也可在这里继续等待或打开结果。
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <RefreshCcwIcon data-icon="inline-start" />}
          刷新
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>共 {jobs.length} 条</span>
          <span>· 进行中 {activeCount}</span>
          <span>· 失败 {failedCount}</span>
          <span>· 每 5 秒自动刷新</span>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading && jobs.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="animate-spin" />
            正在加载任务…
          </div>
        ) : null}

        {!loading && jobs.length === 0 ? (
          <Alert>
            <Clock3Icon />
            <AlertTitle>暂无任务</AlertTitle>
            <AlertDescription>提交架构生成或页面生成后，会在这里显示任务进度。</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const busy = busyId === job.id
            const isActive = job.status === "queued" || job.status === "running"
            const isSuccess = job.status === "succeeded"
            const isFailed = job.status === "failed"
            return (
              <div key={job.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{typeLabel(job.type)}</p>
                      {statusBadge(job.status)}
                      <Badge variant="secondary">{job.progress ?? 0}%</Badge>
                      <button type="button" className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => router.push(`/workspace/jobs/detail?id=${job.id}`)}>#{job.id.slice(0, 10)}</button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      创建：{formatTime(job.createdAt)} · 更新：{formatTime(job.updatedAt)}
                      {job.startedAt ? ` · 开始：${formatTime(job.startedAt)}` : ""}
                      {job.finishedAt ? ` · 结束：${formatTime(job.finishedAt)}` : ""}
                    </p>
                    {isFailed && job.error ? (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive break-all whitespace-pre-wrap">{job.error}</p>
                        {slideFailures(job).length > 0 ? (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                            <p className="mb-2 text-xs font-medium text-destructive">页面失败详情</p>
                            <div className="space-y-1.5">
                              {slideFailures(job).map((item) => (
                                <div key={item.slideId} className="text-xs text-destructive/90">
                                  <span className="font-mono">{item.slideId}</span>
                                  {item.title ? <span className="mx-1 text-muted-foreground">· {item.title}</span> : null}
                                  <div className="break-all text-destructive">{item.error}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {isSuccess ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        任务已完成，可打开结果并回到对应页面。
                        {slideFailures(job).length > 0
                          ? `（其中 ${slideFailures(job).length} 页失败，可在预览页重试）`
                          : ""}
                      </p>
                    ) : null}
                    {isActive ? (
                      <p className="text-sm text-muted-foreground">
                        任务仍在后台执行。可点击“继续等待”，或稍后再回来查看。
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/workspace/jobs/detail?id=${job.id}`)}>
                      查看详情
                    </Button>
                    {isActive ? (
                      <Button size="sm" onClick={() => void handleContinue(job)} disabled={busy}>
                        {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <PlayCircleIcon data-icon="inline-start" />}
                        继续等待
                      </Button>
                    ) : null}
                    {isSuccess || (job.type === "svg" && slideFailures(job).length > 0) ? (
                      <Button size="sm" onClick={() => void handleOpenResult(job)} disabled={busy}>
                        {busy ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <CheckCircle2Icon data-icon="inline-start" />}
                        {isSuccess ? "打开结果" : "查看失败页"}
                      </Button>
                    ) : null}
                    {isFailed ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const detail = [
                              job.error || "任务失败",
                              ...slideFailures(job).map((s) => `${s.slideId}${s.title ? `(${s.title})` : ""}: ${s.error}`),
                            ].join("\n")
                            try {
                              await navigator.clipboard.writeText(detail)
                              toast.success("失败详情已复制")
                            } catch {
                              toast.message(detail)
                            }
                          }}
                          disabled={busy}
                        >
                          <AlertCircleIcon data-icon="inline-start" />
                          复制错误
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void load()} disabled={busy}>
                          <XCircleIcon data-icon="inline-start" />
                          刷新状态
                        </Button>
                      </>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => void load()} disabled={busy}>
                      <RotateCcwIcon data-icon="inline-start" />
                      刷新
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
