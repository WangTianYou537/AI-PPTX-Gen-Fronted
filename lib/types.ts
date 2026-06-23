export type Provider = "openai" | "gemini" | "claude"

export type ApiConfig = {
  provider: Provider
  apiKey: string
  baseURL: string
  model: string
}

export type TopicInput = {
  topic: string
  audience: string
  slideCount: number
  style: string
}

export type SlideOutline = {
  id: string
  title: string
  purpose: string
  keyPoints: string[]
  visualHint: string
}

export type PresentationOutline = {
  title: string
  theme: string
  audience: string
  style: string
  slides: SlideOutline[]
}

export type SlideSVG = {
  slideId: string
  title: string
  svg: string
}

export type SVGResponse = {
  slides: SlideSVG[]
}

export type UserRole = "admin" | "user"

export type User = {
  id: string
  email: string
  role: UserRole
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export type SetupStatus = {
  needsSetup: boolean
}

export type AuthResponse = {
  user: User
}

export type ModelConfig = {
  provider: Provider
  apiKey: string
  baseURL: string
  model: string
}

export type GenerationRoleSettings = {
  systemPrompt: string
  supportsTools: boolean
  modelConfig: ModelConfig
}

export type PromptSettings = {
  architect: GenerationRoleSettings
  svg: GenerationRoleSettings
  updatedAt: string
  updatedBy: string
}
