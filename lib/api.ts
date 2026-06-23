import type {
  AuthResponse,
  PresentationOutline,
  PromptSettings,
  SetupStatus,
  SlideSVG,
  SVGResponse,
  TopicInput,
  User,
  UserRole,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

type APIError = {
  error?: string
}

type UserPayload = {
  email?: string
  password?: string
  role?: UserRole
  disabled?: boolean
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as APIError
    throw new Error(body.error || `请求失败：${response.status}`)
  }

  return response.json() as Promise<T>
}

async function postJSON<T>(path: string, payload: unknown): Promise<T> {
  return requestJSON<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getSetupStatus() {
  return requestJSON<SetupStatus>("/api/setup/status")
}

export function setupAdmin(email: string, password: string) {
  return postJSON<AuthResponse>("/api/setup/admin", { email, password })
}

export function login(email: string, password: string) {
  return postJSON<AuthResponse>("/api/auth/login", { email, password })
}

export function logout() {
  return postJSON<{ ok: boolean }>("/api/auth/logout", {})
}

export function getMe() {
  return requestJSON<AuthResponse>("/api/auth/me")
}

export function listUsers() {
  return requestJSON<{ users: User[] }>("/api/admin/users")
}

export function createUser(payload: Required<Pick<UserPayload, "email" | "password">> & Pick<UserPayload, "role" | "disabled">) {
  return postJSON<User>("/api/admin/users", payload)
}

export function updateUser(id: string, payload: UserPayload) {
  return requestJSON<User>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: string) {
  return requestJSON<{ ok: boolean }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  })
}

export function getPrompts() {
  return requestJSON<PromptSettings>("/api/admin/prompts")
}

export function savePrompts(payload: PromptSettings) {
  return requestJSON<PromptSettings>("/api/admin/prompts", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function resetPrompts() {
  return postJSON<PromptSettings>("/api/admin/prompts/reset", {})
}

export async function exportPPTX(title: string, slides: SlideSVG[]) {
  const response = await fetch(`${API_BASE_URL}/api/export-pptx`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, slides }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as APIError
    throw new Error(body.error || `请求失败：${response.status}`)
  }

  return response.blob()
}

export function generateOutline(input: TopicInput) {
  return postJSON<PresentationOutline>("/api/architect", input)
}

export function generateSVG(outline: PresentationOutline) {
  return postJSON<SVGResponse>("/api/generate-svg", {
    outline,
  })
}
