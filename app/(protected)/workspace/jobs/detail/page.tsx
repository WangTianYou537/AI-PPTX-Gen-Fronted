"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { JobDetailPanel } from "@/components/job-detail-panel"

function JobDetailInner() {
  const params = useSearchParams()
  const jobId = params.get("id") || ""
  if (!jobId) {
    return <div className="p-6 text-sm text-muted-foreground">缺少任务 ID，请从任务列表进入。</div>
  }
  return <JobDetailPanel jobId={jobId} />
}

export default function WorkspaceJobDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">加载中…</div>}>
      <JobDetailInner />
    </Suspense>
  )
}
