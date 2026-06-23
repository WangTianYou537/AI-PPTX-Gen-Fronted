"use client"

import type { PresentationOutline } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircleIcon, CheckIcon, Loader2Icon, WandSparklesIcon } from "lucide-react"

type OutlineEditorProps = {
  outline: PresentationOutline | null
  draft: string
  error: string
  isGenerating: boolean
  onDraftChange: (value: string) => void
  onApply: () => void
  onGenerateSVG: () => void
}

export function OutlineEditor({
  outline,
  draft,
  error,
  isGenerating,
  onDraftChange,
  onApply,
  onGenerateSVG,
}: OutlineEditorProps) {
  if (!outline) {
    return (
      <Alert>
        <AlertCircleIcon />
        <AlertTitle>等待生成架构</AlertTitle>
        <AlertDescription>先输入主题并生成 PPT 架构，随后可以在这里审核和修改。</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="outline-json">架构 JSON</FieldLabel>
          <Textarea
            id="outline-json"
            aria-invalid={Boolean(error)}
            value={draft}
            className="min-h-96 font-mono text-xs"
            onChange={(event) => onDraftChange(event.target.value)}
          />
          <FieldDescription>可以直接修改标题、页数、每页要点和视觉提示。</FieldDescription>
          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>JSON 格式有误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onApply}>
            <CheckIcon data-icon="inline-start" />
            应用修改
          </Button>
          <Button onClick={onGenerateSVG} disabled={isGenerating || Boolean(error)}>
            {isGenerating ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <WandSparklesIcon data-icon="inline-start" />
            )}
            生成 SVG 页面
          </Button>
        </div>
      </FieldGroup>

      <Card>
        <CardHeader>
          <CardTitle>{outline.title}</CardTitle>
          <CardDescription>{outline.audience || "通用受众"} · {outline.style || "默认风格"}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pr-3">
            <div className="flex flex-col gap-3">
              {outline.slides.map((slide) => (
                <div key={slide.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-medium">{slide.title}</h3>
                    <Badge variant="secondary">{slide.id}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{slide.purpose}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {slide.keyPoints.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
