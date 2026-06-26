"use client"

import type { PresentationOutline, SlideOutline } from "@/lib/types"
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
      <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
        <AlertCircleIcon className="size-4.5" />
        <AlertTitle className="text-sm font-semibold">等待生成架构</AlertTitle>
        <AlertDescription className="text-sm mt-1">先输入主题并生成 PPT 架构，随后可以在这里审核和修改。</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
      
      {/* 左侧：编辑区 */}
      <FieldGroup className="flex flex-col justify-between h-full">
        <Field data-invalid={Boolean(error)} className="flex-1 flex flex-col gap-2">
          <FieldLabel htmlFor="outline-json" className="text-sm font-semibold text-zinc-400">架构 JSON</FieldLabel>
          
          {/* 🚀 优化 1：彻底重构 Textarea。
              限制 h-[480px]，禁用 resize，添加 border-zinc-800，文字改为亮色 text-zinc-200，绝不无限拖长 */}
          <Textarea
            id="outline-json"
            aria-invalid={Boolean(error)}
            value={draft}
            className="h-[480px] font-mono text-xs border-zinc-800 bg-zinc-900/40 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-indigo-500 resize-none overflow-y-auto"
            onChange={(event) => onDraftChange(event.target.value)}
          />
          
          <FieldDescription className="text-xs text-zinc-400 leading-normal">
            可以直接修改标题、页数、每页要点和视觉提示。
          </FieldDescription>
          
          {error ? (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive mt-1">
              <AlertCircleIcon className="size-4.5 shrink-0" />
              <div className="space-y-1">
                <AlertTitle className="text-sm font-semibold">JSON 格式有误</AlertTitle>
                <AlertDescription className="text-xs leading-normal">{error}</AlertDescription>
              </div>
            </Alert>
          ) : null}
        </Field>

        {/* 底部控制按钮 */}
        <div className="flex flex-wrap gap-2.5 pt-4 mt-auto border-t border-zinc-800/60">
          <Button variant="outline" onClick={onApply} className="text-sm font-medium gap-1.5 cursor-pointer">
            <CheckIcon className="size-4" />
            应用修改
          </Button>
          <Button onClick={onGenerateSVG} disabled={isGenerating || Boolean(error)} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-medium gap-1.5 cursor-pointer">
            {isGenerating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <WandSparklesIcon className="size-4" />
            )}
            生成 PPT 页面
          </Button>
        </div>
      </FieldGroup>

      {/* 右侧：高对比度预览卡片 (🚀 统一为微玻片样式，边界感十足) */}
      <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col justify-between">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-zinc-100">{outline.title}</CardTitle>
          <CardDescription className="text-xs text-zinc-400 mt-1">
            {outline.audience || "通用受众"} · {outline.style || "默认风格"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {/* 🚀 高度与左侧输入框自适应对齐 */}
          <ScrollArea className="h-[420px] pr-3">
            <div className="flex flex-col gap-3">
              {outline.slides.map((slide: SlideOutline) => (
                /* 🚀 预览小卡片升级：增加 border-zinc-800/80，背景提亮至 bg-zinc-900/60，让轮廓极其硬朗 */
                <div key={slide.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-md shadow-black/25">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-bold text-zinc-200">{slide.title}</h3>
                    {/* Badge 提亮 */}
                    <Badge variant="secondary" className="bg-zinc-800 border-zinc-700/50 text-zinc-300 font-mono text-[10px]">
                      {slide.id}
                    </Badge>
                  </div>
                  
                  {/* 正文说明字号调优，改为 text-zinc-300，彻底告别看不清的问题 */}
                  <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed">{slide.purpose}</p>
                  
                  {/* 点状列表文字改为 text-zinc-300，并在圆点处统一为亮色靛蓝，极具辨识度 */}
                  <ul className="mt-2.5 flex flex-col gap-1.5 text-xs text-zinc-400">
                    {slide.keyPoints.map((point: string) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="text-indigo-400 select-none text-sm leading-none">•</span>
                        <span className="text-zinc-300 leading-normal">{point}</span>
                      </li>
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