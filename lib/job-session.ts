export type ActiveJobSession = {
  jobId: string
  type: "outline" | "svg"
  createdAt: string
}

const KEY = "ppt-gen:active-job"

export function saveActiveJob(session: ActiveJobSession | null) {
  if (typeof window === "undefined") return
  if (!session) {
    window.localStorage.removeItem(KEY)
    return
  }
  window.localStorage.setItem(KEY, JSON.stringify(session))
}

export function loadActiveJob(): ActiveJobSession | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ActiveJobSession
    if (!parsed?.jobId || !parsed?.type) return null
    return parsed
  } catch {
    return null
  }
}

export function clearActiveJob() {
  saveActiveJob(null)
}
