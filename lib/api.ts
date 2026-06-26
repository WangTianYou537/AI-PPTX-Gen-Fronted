import type {
  AuthResponse,
  EffectiveQuota,
  PresentationOutline,
  PromptSettings,
  SetupStatus,
  SlideSVG,
  StorageConfig,
  SupportedStorageOption,
  SVGResponse,
  SystemSettings,
  TopicInput,
  User,
  UserGroup,
  UserRole,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

type APIErrorBody = { error?: string; detail?: string; requestId?: string }

export class APIRequestError extends Error {
  status: number
  path: string
  method: string
  requestId?: string
  detail?: string
  raw?: string
  constructor(input: { message: string; status: number; path: string; method: string; requestId?: string; detail?: string; raw?: string }) {
    super(input.message)
    this.name = "APIRequestError"
    this.status = input.status
    this.path = input.path
    this.method = input.method
    this.requestId = input.requestId
    this.detail = input.detail
    this.raw = input.raw
  }
}

type UserPayload = { email?: string; username?: string; password?: string; role?: UserRole; disabled?: boolean; groupId?: string; dailyPPTLimit?: number | null; dailySlideLimit?: number | null }
type UserGroupPayload = { name?: string; description?: string; dailyPPTLimit?: number; dailySlideLimit?: number; isDefault?: boolean }

async function parseAPIError(response: Response, path: string, method: string): Promise<APIRequestError> {
  const raw = await response.text().catch(() => "")
  let body: APIErrorBody = {}
  try { body = raw ? JSON.parse(raw) as APIErrorBody : {} } catch { body = {} }
  const requestId = body.requestId || response.headers.get("X-Request-ID") || undefined
  return new APIRequestError({ message: body.error || `请求失败：${response.status}`, status: response.status, path, method, requestId, detail: body.detail, raw: raw && !body.error ? raw.slice(0, 4000) : undefined })
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method || "GET"
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "same-origin", ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } })
  if (!response.ok) throw await parseAPIError(response, path, method)
  return response.json() as Promise<T>
}

async function postJSON<T>(path: string, payload: unknown): Promise<T> { return requestJSON<T>(path, { method: "POST", body: JSON.stringify(payload) }) }
export function getSetupStatus() { return requestJSON<SetupStatus>("/api/setup/status") }
export function setupAdmin(email: string, password: string, storage?: StorageConfig, username?: string) { return postJSON<AuthResponse>("/api/setup/admin", { email, username, password, storage }) }
export function testSetupStorage(storage: StorageConfig) { return postJSON<{ ok: boolean }>("/api/setup/storage/test", { storage }) }
export function login(email: string, password: string) { return postJSON<AuthResponse>("/api/auth/login", { email, password }) }
export function register(email: string, password: string, username?: string) { return postJSON<AuthResponse>("/api/auth/register", { email, username, password }) }
export function logout() { return postJSON<{ ok: boolean }>("/api/auth/logout", {}) }
export function getMe() { return requestJSON<AuthResponse>("/api/auth/me") }
export function getMyQuota() { return requestJSON<EffectiveQuota>("/api/me/quota") }
export function listUsers() { return requestJSON<{ users: User[] }>("/api/admin/users") }
export function createUser(payload: Required<Pick<UserPayload, "email" | "password">> & Pick<UserPayload, "username" | "role" | "disabled" | "groupId" | "dailyPPTLimit" | "dailySlideLimit">) { return postJSON<User>("/api/admin/users", payload) }
export function updateUser(id: string, payload: UserPayload) { return requestJSON<User>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }) }
export function deleteUser(id: string) { return requestJSON<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }) }
export function getAdminSettings() { return requestJSON<SystemSettings>("/api/admin/settings") }
export function saveAdminSettings(payload: Pick<SystemSettings, "registrationEnabled" | "defaultUserGroupId">) { return requestJSON<SystemSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) }) }
export function listUserGroups() { return requestJSON<{ groups: UserGroup[] }>("/api/admin/groups") }
export function createUserGroup(payload: Required<Pick<UserGroupPayload, "name" | "dailyPPTLimit" | "dailySlideLimit">> & Pick<UserGroupPayload, "description" | "isDefault">) { return postJSON<UserGroup>("/api/admin/groups", payload) }
export function updateUserGroup(id: string, payload: UserGroupPayload) { return requestJSON<UserGroup>(`/api/admin/groups/${id}`, { method: "PATCH", body: JSON.stringify(payload) }) }
export function deleteUserGroup(id: string) { return requestJSON<{ ok: boolean }>(`/api/admin/groups/${id}`, { method: "DELETE" }) }
export function getPrompts() { return requestJSON<PromptSettings>("/api/admin/prompts") }
export function savePrompts(payload: PromptSettings) { return requestJSON<PromptSettings>("/api/admin/prompts", { method: "PUT", body: JSON.stringify(payload) }) }
export function resetPrompts() { return postJSON<PromptSettings>("/api/admin/prompts/reset", {}) }
export type StorageResponse = { storageConfigured: boolean; storage?: StorageConfig; supportedStorage: SupportedStorageOption[] }
export function getAdminStorage() { return requestJSON<StorageResponse>("/api/admin/storage") }
export function testAdminStorage(storage: StorageConfig) { return postJSON<{ ok: boolean }>("/api/admin/storage/test", { storage }) }
export function switchAdminStorage(storage: StorageConfig) { return postJSON<StorageResponse>("/api/admin/storage/switch", { storage }) }
export async function exportPPTX(title: string, slides: SlideSVG[]) {
  const path = "/api/export-pptx"
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, slides }) })
  if (!response.ok) throw await parseAPIError(response, path, "POST")
  return response.blob()
}
export function generateOutline(input: TopicInput) { return postJSON<PresentationOutline>("/api/architect", input) }
export function generateSVG(outline: PresentationOutline) { return postJSON<SVGResponse>("/api/generate-svg", { outline }) }
