"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAppShell } from "@/components/app-shell"
import { PPTWorkspace } from "@/components/ppt-workspace"
import { pageIdToPath, pathToPageId, type AppPageId } from "@/lib/navigation"

export function WorkspaceRouteShell() {
  const pathname = usePathname()
  const router = useRouter()
  const { setQuota } = useAppShell()
  const activePage = pathToPageId(pathname)
  const workspacePage: AppPageId = activePage.startsWith("workspace.") ? activePage : "workspace.overview"

  return (
    <PPTWorkspace
      compact
      activePage={workspacePage}
      onPageChange={(page) => router.push(pageIdToPath(page))}
      onQuotaChange={setQuota}
    />
  )
}
