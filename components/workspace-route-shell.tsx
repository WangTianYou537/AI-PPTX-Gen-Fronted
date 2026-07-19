"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAppShell } from "@/components/app-shell"
import { JobDetailPanel } from "@/components/job-detail-panel"
import { JobListPanel } from "@/components/job-list-panel"
import { PPTWorkspace } from "@/components/ppt-workspace"
import { pageIdToPath, pathToPageId, type AppPageId } from "@/lib/navigation"

function WorkspaceJobsRouter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (pathname.includes("/workspace/jobs/detail")) {
    const jobId = searchParams.get("id") || ""
    return <JobDetailPanel jobId={jobId} />
  }
  if (pathname.includes("/workspace/jobs")) {
    return <JobListPanel />
  }
  return null
}

export function WorkspaceRouteShell() {
  const pathname = usePathname()
  const router = useRouter()
  const { setQuota } = useAppShell()
  const activePage = pathToPageId(pathname)

  if (pathname.includes("/workspace/jobs")) {
    return (
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">加载任务…</div>}>
        <WorkspaceJobsRouter />
      </Suspense>
    )
  }

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
