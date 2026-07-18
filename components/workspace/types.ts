import type { EffectiveQuota, PresentationOutline, SlideOutline, SlideSVG, TopicInput } from "@/lib/types"
import type { AppPageId } from "@/lib/navigation"

export type WorkspaceStepProps = {
  topic: TopicInput
  setTopic: (topic: TopicInput) => void
  outline: PresentationOutline | null
  outlineDraft: string
  setOutlineDraft: (draft: string) => void
  outlineError: string
  outlineMode: "visual" | "json"
  svgs: SlideSVG[]
  isArchitecting: boolean
  isGeneratingSVG: boolean
  isExportingPPTX: boolean
  onPageChange: (page: AppPageId) => void
  onGenerateOutline: () => void
  onApplyOutline: () => void
  onGenerateSVG: () => void
  onExportPPTX: () => void
  onTabChange: (mode: "visual" | "json") => void
  onUpdateTitle: (val: string) => void
  onUpdateSlideField: (slideIndex: number, field: "title" | "purpose" | "visualHint", val: string) => void
  onUpdateBullet: (slideIndex: number, bulletIndex: number, val: string) => void
  onAddBullet: (slideIndex: number) => void
  onDeleteBullet: (slideIndex: number, bulletIndex: number) => void
  onAddSlide: () => void
  onDeleteSlide: (slideIndex: number) => void
}

export type WorkspaceShellProps = {
  compact?: boolean
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
  onQuotaChange?: (quota: EffectiveQuota) => void
}

export type { PresentationOutline, SlideOutline, SlideSVG, TopicInput, AppPageId }
