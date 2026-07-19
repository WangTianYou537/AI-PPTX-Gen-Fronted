"use client"

import { ArrowRightIcon, FileImageIcon } from "lucide-react"
import type { AppPageId } from "@/lib/navigation"
import type { PresentationOutline, SlideSVG } from "@/lib/types"
import { SVGPreviewGrid } from "@/components/svg-preview-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function WorkspacePPTStep({
  outline,
  svgs,
  isExportingPPTX,
  regeneratingId,
  revisingId,
  batchRetrying,
  batchRetryProgress,
  onPageChange,
  onExportPPTX,
  onRegenerateSlide,
  onRegenerateFailedSlides,
  onReviseSlide,
}: {
  outline: PresentationOutline | null
  svgs: SlideSVG[]
  isExportingPPTX: boolean
  regeneratingId?: string | null
  revisingId?: string | null
  batchRetrying?: boolean
  batchRetryProgress?: { done: number; total: number; current?: string } | null
  onPageChange: (page: AppPageId) => void
  onExportPPTX: () => void
  onRegenerateSlide?: (slideId: string) => void
  onRegenerateFailedSlides?: () => void
  onReviseSlide?: (slideId: string, instruction: string, currentSvg: string) => void
}) {
  if (!svgs || svgs.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-dashed border-2 border-border/60 bg-card/40 py-14 text-center shadow-none backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-950/40">
              <FileImageIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">暂无幻灯片预览</h4>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                请确保在“大纲审核”中调整大纲并保存后，一键生成渲染出幻灯片。
              </p>
            </div>
            <Button
              size="default"
              variant="outline"
              onClick={() => onPageChange(outline ? "workspace.outline" : "workspace.topic")}
              className="mt-2 cursor-pointer gap-2 text-sm"
            >
              {outline ? "前往架构审核" : "去设定主题"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const failed = svgs.filter((s) => s.error || !s.svg).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1.5 pb-1">
        <h2 className="text-lg font-bold text-foreground">幻灯片预览与导出</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          预览渲染出来的多页 PPT 幻灯片。
          {failed > 0 ? " 失败页面可单独或批量重新生成，不会中断其他页面。" : " 确认效果后一键打包导出。"}
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/45 backdrop-blur-sm">
        <SVGPreviewGrid
          slides={svgs}
          isExporting={isExportingPPTX}
          regeneratingId={regeneratingId}
          revisingId={revisingId}
          batchRetrying={batchRetrying}
          batchRetryProgress={batchRetryProgress}
          onExportPPTX={onExportPPTX}
          onRegenerateSlide={onRegenerateSlide}
          onRegenerateFailedSlides={onRegenerateFailedSlides}
          onReviseSlide={onReviseSlide}
        />
      </div>
    </div>
  )
}
