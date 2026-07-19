import type { PresentationOutline, SlideSVG, TopicInput } from "@/lib/types"

const KEY = "ppt-gen:workspace-draft"

export type WorkspaceDraft = {
  topic?: TopicInput
  outline?: PresentationOutline | null
  outlineDraft?: string
  svgs?: SlideSVG[]
  lastSvgJobId?: string
  lastOutlineJobId?: string
  updatedAt?: string
}

export function saveWorkspaceDraft(draft: WorkspaceDraft) {
  if (typeof window === "undefined") return
  try {
    const prev = loadWorkspaceDraft() || {}
    const next: WorkspaceDraft = {
      ...prev,
      updatedAt: new Date().toISOString(),
    }
    // Only overwrite fields that are explicitly provided (including null/empty arrays when intentional).
    if ("topic" in draft && draft.topic !== undefined) next.topic = draft.topic
    if ("outline" in draft) next.outline = draft.outline
    if ("outlineDraft" in draft && draft.outlineDraft !== undefined) next.outlineDraft = draft.outlineDraft
    if ("svgs" in draft && draft.svgs !== undefined) next.svgs = draft.svgs
    if ("lastSvgJobId" in draft && draft.lastSvgJobId !== undefined) next.lastSvgJobId = draft.lastSvgJobId
    if ("lastOutlineJobId" in draft && draft.lastOutlineJobId !== undefined) next.lastOutlineJobId = draft.lastOutlineJobId
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
}

export function loadWorkspaceDraft(): WorkspaceDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as WorkspaceDraft
  } catch {
    return null
  }
}

export function clearWorkspaceDraft() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(KEY)
}

export function isValidOutline(value: unknown): value is PresentationOutline {
  if (!value || typeof value !== "object") return false
  const o = value as PresentationOutline
  return Boolean(o.title && Array.isArray(o.slides) && o.slides.length > 0 && o.slides.every((s) => s && s.id && s.title))
}
