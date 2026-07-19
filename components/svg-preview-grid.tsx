"use client"

import * as React from "react"
import type { SlideSVG } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangleIcon,
  DownloadIcon,
  ImageIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

type SVGPreviewGridProps = {
  slides: SlideSVG[]
  isExporting?: boolean
  regeneratingId?: string | null
  revisingId?: string | null
  batchRetrying?: boolean
  batchRetryProgress?: { done: number; total: number; current?: string } | null
  onExportPPTX?: () => void
  onRegenerateSlide?: (slideId: string) => void
  onRegenerateFailedSlides?: () => void
  onReviseSlide?: (slideId: string, instruction: string, currentSvg: string) => void
}

export function SVGPreviewGrid({
  slides,
  isExporting = false,
  regeneratingId = null,
  revisingId = null,
  batchRetrying = false,
  batchRetryProgress = null,
  onExportPPTX,
  onRegenerateSlide,
  onRegenerateFailedSlides,
  onReviseSlide,
}: SVGPreviewGridProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [instruction, setInstruction] = React.useState("")

  if (slides.length === 0) {
    return (
      <Alert>
        <ImageIcon />
        <AlertTitle>还没有 Slide页面</AlertTitle>
        <AlertDescription>确认架构后点击“生成页面”，这里会显示每页预览。</AlertDescription>
      </Alert>
    )
  }

  const failed = slides.filter((s) => s.error || !s.svg).length
  const success = slides.length - failed

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">PPT 页面预览</h3>
          <p className="text-sm text-muted-foreground">
            共 {slides.length} 页，成功 {success} 页
            {failed > 0 ? `，失败 ${failed} 页（可单独/批量重试）` : ""}。可对单页描述修改要求，由 AI 改图。
            {batchRetrying && batchRetryProgress
              ? ` 批量重试中 ${batchRetryProgress.done}/${batchRetryProgress.total}${batchRetryProgress.current ? ` · ${batchRetryProgress.current}` : ""}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {failed > 0 && onRegenerateFailedSlides ? (
            <Button
              variant="outline"
              onClick={onRegenerateFailedSlides}
              disabled={batchRetrying || Boolean(regeneratingId) || Boolean(revisingId)}
            >
              {batchRetrying ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <RefreshCcwIcon data-icon="inline-start" />
              )}
              {batchRetrying
                ? `批量重试中 ${batchRetryProgress?.done || 0}/${batchRetryProgress?.total || failed}`
                : `后台批量重试失败页（${failed}）`}
            </Button>
          ) : null}
          {onExportPPTX ? (
            <Button onClick={onExportPPTX} disabled={isExporting || success === 0 || batchRetrying}>
              {isExporting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <DownloadIcon data-icon="inline-start" />}
              导出 PPTX{success > 0 ? `（${success} 页）` : ""}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {slides.map((slide) => {
          const isFailed = Boolean(slide.error || !slide.svg)
          // Only the currently regenerating/revising slide shows a spinner.
          // Batch mode disables other actions, but must not mark every slide as "busy".
          const isCurrentBusy = regeneratingId === slide.slideId || revisingId === slide.slideId
          const actionsDisabled = batchRetrying || isCurrentBusy
          const isEditing = editingId === slide.slideId
          return (
            <Card key={slide.slideId} className={isFailed ? "border-destructive/40" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="truncate text-base">{slide.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {isFailed ? <Badge variant="destructive">失败</Badge> : <Badge variant="outline">成功</Badge>}
                    <Badge variant="outline">{slide.slideId}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isFailed ? (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-4 text-center">
                    <AlertTriangleIcon className="text-destructive" />
                    <p className="text-sm text-destructive">{slide.error || "生成失败"}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {onRegenerateSlide ? (
                        <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => onRegenerateSlide(slide.slideId)}>
                          {isCurrentBusy ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}
                          后台重试此页
                        </Button>
                      ) : null}
                      {onReviseSlide ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionsDisabled}
                          onClick={() => {
                            setEditingId(slide.slideId)
                            setInstruction("")
                          }}
                        >
                          <SparklesIcon data-icon="inline-start" />
                          AI 修改
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div
                    className="aspect-video overflow-hidden rounded-lg border bg-muted flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block [&>svg]:max-w-full [&>svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: slide.svg }}
                  />
                )}

                {isEditing ? (
                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">AI 修改此页</p>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={actionsDisabled}>
                        <XIcon data-icon="inline-start" />
                        取消
                      </Button>
                    </div>
                    <Textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="例如：标题改成更简洁；主色调改为深蓝；右侧加一个三步流程图；减少文字密度"
                      className="min-h-24 text-sm"
                      disabled={actionsDisabled}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={actionsDisabled || !instruction.trim() || !onReviseSlide}
                        onClick={() => {
                          if (!onReviseSlide || !instruction.trim()) return
                          onReviseSlide(slide.slideId, instruction.trim(), slide.svg || "")
                        }}
                      >
                        {revisingId === slide.slideId ? (
                          <Loader2Icon data-icon="inline-start" className="animate-spin" />
                        ) : (
                          <SparklesIcon data-icon="inline-start" />
                        )}
                        提交修改
                      </Button>
                      {onRegenerateSlide ? (
                        <Button size="sm" variant="outline" disabled={actionsDisabled} onClick={() => onRegenerateSlide(slide.slideId)}>
                          <RefreshCcwIcon data-icon="inline-start" />
                          完全重生成
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-end gap-2">
                    {onReviseSlide ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionsDisabled}
                        onClick={() => {
                          setEditingId(slide.slideId)
                          setInstruction("")
                        }}
                      >
                        <SparklesIcon data-icon="inline-start" />
                        AI 修改
                      </Button>
                    ) : null}
                    {onRegenerateSlide ? (
                      <Button size="sm" variant="ghost" disabled={actionsDisabled} onClick={() => onRegenerateSlide(slide.slideId)}>
                        {isCurrentBusy ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}
                        后台重试
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
