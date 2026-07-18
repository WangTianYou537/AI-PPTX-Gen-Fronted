export type Provider = "openai" | "openai-responses" | "gemini" | "claude"

export type TopicInput = { topic: string; audience: string; slideCount: number; style: string }
export type SlideOutline = { id: string; title: string; purpose: string; keyPoints: string[]; visualHint: string }
export type PresentationOutline = { title: string; theme: string; audience: string; style: string; slides: SlideOutline[] }
export type SlideSVG = { slideId: string; title: string; svg: string }
export type EffectiveQuota = { date: string; dailyPPTLimit: number; dailySlideLimit: number; pptUsed: number; slidesUsed: number; pptReserved: number; slidesReserved: number; pptRemaining: number; slidesRemaining: number; source: "user" | "group"; groupId: string; groupName: string }
export type SVGResponse = { slides: SlideSVG[]; quota?: EffectiveQuota }
export type UserRole = "admin" | "user"
export type User = { id: string; email: string; username: string; role: UserRole; disabled: boolean; groupId: string; dailyPPTLimit?: number | null; dailySlideLimit?: number | null; slideConcurrencyLimit?: number | null; createdAt: string; updatedAt: string }
export type UserGroup = { id: string; name: string; description: string; dailyPPTLimit: number; dailySlideLimit: number; slideConcurrencyLimit: number; isDefault: boolean; createdAt: string; updatedAt: string }
export type SystemSettings = { registrationEnabled: boolean; defaultUserGroupId: string; defaultSlideConcurrencyLimit: number; updatedAt: string; updatedBy: string }
export type StorageKind = "json" | "sqlite" | "postgres" | "mysql" | "redis"
export type StorageConfig = { kind: StorageKind | ""; path?: string; dsn?: string; updatedAt?: string }
export type SupportedStorageOption = { kind: StorageKind; label: string; status: "supported" | "advanced" | "comingSoon" | "notPrimaryStore"; defaultPath?: string; description: string }
export type SetupStatus = { needsSetup: boolean; storageConfigured?: boolean; storage?: StorageConfig; supportedStorage?: SupportedStorageOption[] }
export type BootstrapResponse = { needsSetup: boolean; storageConfigured: boolean; user?: User; quota?: EffectiveQuota }
export type AuthResponse = { user: User }
export type ModelConfig = { provider: Provider; apiKey: string; baseURL: string; model: string }
export type LLMProvider = { id: string; name: string; kind: Provider; baseURL: string; apiKey: string; enabled: boolean; createdAt: string; updatedAt: string }
export type LLMModelInfo = { id: string; name?: string }
export type GenerationRoleSettings = { systemPrompt: string; supportsTools: boolean; requestJson?: string; providerId?: string; model?: string; modelConfig: ModelConfig }
export type PromptSettings = { architect: GenerationRoleSettings; svg: GenerationRoleSettings; updatedAt: string; updatedBy: string }
export type JobType = "outline" | "svg"
export type JobStatus = "queued" | "running" | "succeeded" | "failed"
export type GenerationJob = {
  id: string
  userId: string
  type: JobType
  status: JobStatus
  progress: number
  error?: string
  result?: {
    outline?: PresentationOutline
    slides?: SlideSVG[]
    quota?: EffectiveQuota
  }
  createdAt: string
  updatedAt: string
  startedAt?: string
  finishedAt?: string
}
