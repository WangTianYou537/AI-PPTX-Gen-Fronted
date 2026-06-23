"use client"

import type { SlideSVG } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyIcon, DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react"

type SVGPreviewGridProps = {
  slides: SlideSVG[]
  isExporting?: boolean
  onCopy: (svg: string) => void
  onExportPPTX?: () => void
}

export function SVGPreviewGrid({ slides, isExporting = false, onCopy, onExportPPTX }: SVGPreviewGridProps) {
  if (slides.length === 0) {
    return (
      <Alert>
        <ImageIcon />
        <AlertTitle>还没有 SVG</AlertTitle>
        <AlertDescription>确认架构后点击“生成 SVG 页面”，这里会显示每页预览。</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">SVG 页面预览</h3>
          <p className="text-sm text-muted-foreground">共 {slides.length} 页，可复制单页 SVG 或导出为 PPTX。</p>
        </div>
        {onExportPPTX ? (
          <Button onClick={onExportPPTX} disabled={isExporting}>
            {isExporting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <DownloadIcon data-icon="inline-start" />}
            导出 PPTX
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {slides.map((slide) => (
          <Card key={slide.slideId}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="truncate text-base">{slide.title}</CardTitle>
                <Badge variant="outline">{slide.slideId}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="aspect-video overflow-hidden rounded-lg border bg-muted"
                dangerouslySetInnerHTML={{ __html: slide.svg }}
              />
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => onCopy(slide.svg)}>
                <CopyIcon data-icon="inline-start" />
                复制 SVG
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
