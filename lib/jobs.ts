import { getJob } from "@/lib/api"
import type { GenerationJob, JobType } from "@/lib/types"

export async function waitForJob(
  jobId: string,
  options?: {
    intervalMs?: number
    /** Soft timeout: show a notice and keep waiting if job is still active. */
    softTimeoutMs?: number
    /** Hard timeout: only abort if exceeded and job is still non-terminal. Default 2h. */
    timeoutMs?: number
    jobType?: JobType
    signal?: AbortSignal
    onUpdate?: (job: GenerationJob) => void
    onSoftTimeout?: (job: GenerationJob) => void
  },
): Promise<GenerationJob> {
  const intervalMs = options?.intervalMs ?? 1500
  const softTimeoutMs = options?.softTimeoutMs ?? (options?.jobType === "svg" ? 20 * 60 * 1000 : 10 * 60 * 1000)
  const timeoutMs = options?.timeoutMs ?? 2 * 60 * 60 * 1000
  const started = Date.now()
  let softNotified = false
  let lastStatus = ""
  let lastProgress = -1
  let lastChangeAt = Date.now()

  while (true) {
    if (options?.signal?.aborted) {
      throw new Error("任务轮询已取消")
    }
    const job = await getJob(jobId)
    options?.onUpdate?.(job)

    if (job.status === "succeeded" || job.status === "failed") {
      return job
    }

    if (job.status !== lastStatus || job.progress !== lastProgress) {
      lastStatus = job.status
      lastProgress = job.progress
      lastChangeAt = Date.now()
    }

    const elapsed = Date.now() - started
    if (!softNotified && elapsed > softTimeoutMs) {
      softNotified = true
      options?.onSoftTimeout?.(job)
    }

    // Only hard-timeout if the job appears abandoned for a long time.
    // If backend still reports queued/running, keep waiting up to timeoutMs.
    if (elapsed > timeoutMs) {
      throw new Error(
        `任务等待超过 ${Math.round(timeoutMs / 60000)} 分钟仍未完成（当前状态：${job.status}）。请稍后刷新页面继续查看，或重新提交任务。`,
      )
    }

    // Adaptive interval: slower when idle, faster when progress changes recently.
    const quietFor = Date.now() - lastChangeAt
    const waitMs = quietFor > 60_000 ? Math.min(intervalMs * 3, 5000) : intervalMs
    await sleep(waitMs, options?.signal)
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("任务轮询已取消"))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error("任务轮询已取消"))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}
