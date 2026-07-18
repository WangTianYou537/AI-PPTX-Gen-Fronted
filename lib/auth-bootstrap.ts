import { getBootstrap } from "@/lib/api"
import type { EffectiveQuota, User } from "@/lib/types"

export type SessionSnapshot =
  | { status: "setup" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User; quota: EffectiveQuota | null }

/**
 * Shared client bootstrap used by AppShell, login/signup gates, and landing CTAs.
 * Uses GET /api/bootstrap so setup + session + quota resolve in one request.
 */
export async function loadSessionSnapshot(options?: { includeQuota?: boolean }): Promise<SessionSnapshot> {
  const bootstrap = await getBootstrap()
  if (bootstrap.needsSetup) {
    return { status: "setup" }
  }
  if (!bootstrap.user) {
    return { status: "anonymous" }
  }
  const quota = options?.includeQuota === false ? null : bootstrap.quota ?? null
  return { status: "authenticated", user: bootstrap.user, quota }
}
