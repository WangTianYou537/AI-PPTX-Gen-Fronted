import { getJob } from "@/lib/api"
import type { GenerationJob } from "@/lib/types"

export async function waitForJob(
  jobId: string,
  options?: {
    intervalMs?: number
    timeoutMs?: number
    signal?: AbortSignal
    onUpdate?: (job: GenerationJob) => void
  },
): Promise<GenerationJob> {
  const intervalMs = options?.intervalMs ?? 1200
  const timeoutMs = options?.timeoutMs ?? 15 * 60 * 1000
  const started = Date.now()

  while (true) {
    if (options?.signal?.aborted) {
      throw new Error("任务轮询已取消")
    }
    const job = await getJob(jobId)
    options?.onUpdate?.(job)
    if (job.status === "succeeded" || job.status === "failed") {
      return job
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error("任务等待超时，请稍后在任务列表重试查看")
    }
    await sleep(intervalMs, options?.signal)
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
