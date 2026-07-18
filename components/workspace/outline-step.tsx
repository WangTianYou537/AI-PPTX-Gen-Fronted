"use client"

import {
  ArrowRightIcon,
  BotIcon,
  ChevronLeftIcon,
  FileTextIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react"
import type { AppPageId } from "@/lib/navigation"
import type { PresentationOutline, TopicInput } from "@/lib/types"
import { OutlineEditor } from "@/components/outline-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type OutlineStepProps = {
  topic: TopicInput
  outline: PresentationOutline | null
  outlineDraft: string
  outlineError: string
  outlineMode: "visual" | "json"
  isGeneratingSVG: boolean
  onPageChange: (page: AppPageId) => void
  onDraftChange: (draft: string) => void
  onApply: () => void
  onGenerateSVG: () => void
  onTabChange: (mode: "visual" | "json") => void
  onUpdateTitle: (val: string) => void
  onUpdateSlideField: (slideIndex: number, field: "title" | "purpose" | "visualHint", val: string) => void
  onUpdateBullet: (slideIndex: number, bulletIndex: number, val: string) => void
  onAddBullet: (slideIndex: number) => void
  onDeleteBullet: (slideIndex: number, bulletIndex: number) => void
  onAddSlide: () => void
  onDeleteSlide: (slideIndex: number) => void
}

export function WorkspaceOutlineStep({
  topic,
  outline,
  outlineDraft,
  outlineError,
  outlineMode,
  isGeneratingSVG,
  onPageChange,
  onDraftChange,
  onApply,
  onGenerateSVG,
  onTabChange,
  onUpdateTitle,
  onUpdateSlideField,
  onUpdateBullet,
  onAddBullet,
  onDeleteBullet,
  onAddSlide,
  onDeleteSlide,
}: OutlineStepProps) {
  if (!outline) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-dashed border-2 border-border/60 bg-card/40 py-14 text-center shadow-none backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40">
              <BotIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">暂无大纲架构</h4>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                大纲架构尚未生成，请先在侧栏切换到“主题输入”提交给 PPT 架构师。
              </p>
            </div>
            <Button size="default" variant="outline" onClick={() => onPageChange("workspace.topic")} className="mt-2 cursor-pointer gap-2 text-sm">
              <ChevronLeftIcon className="h-4 w-4" />
              前往设定主题
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1.5 pb-1">
        <h2 className="text-lg font-bold text-foreground">审核并调整大纲结构</h2>
        <p className="text-sm leading-relaxed text-zinc-400">在确认每页的标题、表达目的和要点后，即可一键渲染 PPT 页面。</p>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex rounded-lg bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => onTabChange("visual")}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all ${
              outlineMode === "visual" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileTextIcon className="size-4" />
            可视化按页编辑
          </button>
          <button
            type="button"
            onClick={() => onTabChange("json")}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all ${
              outlineMode === "json" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BotIcon className="size-4" />
            直接编辑 JSON
          </button>
        </div>

        {outlineMode === "visual" ? (
          <Button onClick={onGenerateSVG} disabled={isGeneratingSVG} className="cursor-pointer gap-1.5 bg-indigo-600 text-xs font-medium text-white shadow-xs hover:bg-indigo-500">
            {isGeneratingSVG ? (
              <>正在渲染幻灯片...</>
            ) : (
              <>
                一键生成 PPT 页面
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </Button>
        ) : null}
      </div>

      {outlineMode === "visual" ? (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/40">
            <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">PPT 主标题</label>
            <input
              type="text"
              value={outline.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="w-full border-b border-transparent bg-transparent pb-1 text-xl font-bold text-zinc-100 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
              placeholder="请输入 PPT 主标题"
            />
            <p className="text-sm leading-relaxed font-medium text-zinc-400">
              受众群体：<span className="text-zinc-300">{topic.audience}</span> · 视觉倾向：<span className="text-zinc-300">{topic.style}</span>
            </p>
          </div>

          <div className="space-y-5">
            {outline.slides.map((slide, slideIndex) => (
              <div
                key={slide.id || slideIndex}
                className="relative space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl shadow-black/50 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => onUpdateSlideField(slideIndex, "title", e.target.value)}
                    className="flex-1 border-b border-transparent bg-transparent pb-0.5 text-base font-bold text-zinc-100 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="设置页面标题"
                  />
                  <div className="flex shrink-0 select-none items-center gap-2">
                    <span className="rounded border border-zinc-700/50 bg-zinc-800 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                      {slide.id || `slide-${slideIndex + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSlide(slideIndex)}
                      className="cursor-pointer rounded p-1.5 text-zinc-400 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="删除此页"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">设计意图 / 页面功能描述</label>
                  <input
                    type="text"
                    value={slide.purpose}
                    onChange={(e) => onUpdateSlideField(slideIndex, "purpose", e.target.value)}
                    className="w-full border-b border-transparent bg-transparent py-1 text-sm text-zinc-200 transition-colors placeholder:text-zinc-500 hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="描述此页面所承载的逻辑意图"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">本页核心要点</label>
                  <div className="space-y-3 pl-2.5">
                    {slide.keyPoints.map((point, bulletIndex) => (
                      <div key={bulletIndex} className="group flex items-center gap-2.5">
                        <span className="shrink-0 select-none text-sm text-indigo-400">•</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => onUpdateBullet(slideIndex, bulletIndex, e.target.value)}
                          className="flex-grow border-b border-transparent bg-transparent pb-0.5 text-sm text-zinc-200 transition-colors placeholder:text-zinc-500 hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
                          placeholder="输入要点内容..."
                          required
                        />
                        <button
                          type="button"
                          onClick={() => onDeleteBullet(slideIndex, bulletIndex)}
                          className="shrink-0 cursor-pointer rounded p-1 text-zinc-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          title="删除此要点"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => onAddBullet(slideIndex)}
                      className="flex cursor-pointer items-center gap-1.5 pt-1 text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      <PlusIcon className="size-3.5" />
                      新增核心要点
                    </button>
                  </div>
                </div>

                <Separator className="my-1 bg-zinc-800/80" />

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-indigo-400/90 uppercase dark:text-indigo-400">
                    <SparklesIcon className="size-3.5" />
                    AI 视觉渲染提示词 (Visual Hint)
                  </label>
                  <input
                    type="text"
                    value={slide.visualHint || ""}
                    onChange={(e) => onUpdateSlideField(slideIndex, "visualHint", e.target.value)}
                    className="w-full border-b border-transparent bg-transparent py-1.5 text-xs font-medium text-zinc-300 italic transition-colors placeholder:text-zinc-600 hover:border-zinc-700 focus:border-indigo-500 focus:outline-none dark:text-zinc-300"
                    placeholder="设置本页特定布局意图"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onAddSlide}
              className="w-full cursor-pointer gap-2 border-2 border-dashed border-zinc-800 py-6 text-sm transition-all hover:border-indigo-500/50 hover:bg-indigo-50/5 hover:text-indigo-500"
            >
              <PlusIcon className="size-4" />
              添加新的 PPT 页面
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-inner shadow-black/45">
          <OutlineEditor
            outline={outline}
            draft={outlineDraft}
            error={outlineError}
            isGenerating={isGeneratingSVG}
            onDraftChange={onDraftChange}
            onApply={onApply}
            onGenerateSVG={onGenerateSVG}
          />
        </div>
      )}
    </div>
  )
}
