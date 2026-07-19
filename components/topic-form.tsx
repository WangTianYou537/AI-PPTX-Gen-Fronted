"use client"

import * as React from "react"
import { toast } from "sonner"
import { uploadFile } from "@/lib/api"
import type { TopicInput, UploadItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Loader2Icon, SparklesIcon, TrashIcon, UploadIcon } from "lucide-react"

type TopicFormProps = {
  value: TopicInput
  isLoading: boolean
  onChange: (value: TopicInput) => void
  onSubmit: () => void
}

export function TopicForm({ value, isLoading, onChange, onSubmit }: TopicFormProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploads, setUploads] = React.useState<UploadItem[]>([])
  const visibleUploads = uploads.filter((u) => (value.uploadIds || []).includes(u.id))

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    setUploading(true)
    try {
      const nextUploads = [...uploads]
      const nextIds = [...(value.uploadIds || [])]
      for (const file of Array.from(fileList)) {
        const item = await uploadFile(file)
        nextUploads.push(item)
        nextIds.push(item.id)
      }
      setUploads(nextUploads)
      onChange({ ...value, uploadIds: nextIds })
      toast.success(`已上传 ${fileList.length} 个文件`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败")
    } finally {
      setUploading(false)
    }
  }

  function removeUpload(id: string) {
    setUploads((current) => current.filter((u) => u.id !== id))
    onChange({ ...value, uploadIds: (value.uploadIds || []).filter((x) => x !== id) })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="topic">PPT 主题</FieldLabel>
        <Textarea
          id="topic"
          value={value.topic}
          placeholder="例如：面向投资人的 AI 教育产品商业计划书"
          onChange={(event) => onChange({ ...value, topic: event.target.value })}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="audience">目标受众</FieldLabel>
          <Input
            id="audience"
            value={value.audience}
            placeholder="投资人 / 老师 / 客户"
            onChange={(event) => onChange({ ...value, audience: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="slide-count">页数</FieldLabel>
          <Input
            id="slide-count"
            type="number"
            min={1}
            max={30}
            value={value.slideCount}
            onChange={(event) =>
              onChange({ ...value, slideCount: Number.parseInt(event.target.value || "8", 10) })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="style">视觉风格</FieldLabel>
          <Input
            id="style"
            value={value.style}
            placeholder="科技、简洁、视觉化"
            onChange={(event) => onChange({ ...value, style: event.target.value })}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="notes">补充说明（可选）</FieldLabel>
        <Textarea
          id="notes"
          value={value.notes || ""}
          placeholder="例如：需要引用最新行业数据；重点强调校园场景"
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
        />
        <FieldDescription>涉及“最新/实时/政策/数据”等内容时，Agent 会触发检索步骤。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>上传材料（可选，图片/PDF/文本）</FieldLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.csv,application/pdf,text/*"
            disabled={uploading || isLoading}
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Badge variant="outline">
            {uploading ? "上传中…" : `${value.uploadIds?.length || 0} 个文件`}
          </Badge>
        </div>
        <FieldDescription>有上传文件时，Agent 会先执行视觉/文档理解步骤。</FieldDescription>
        {visibleUploads.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            {visibleUploads.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.filename}</p>
                  <p className="text-xs text-muted-foreground">{u.contentType} · {(u.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeUpload(u.id)}>
                  <TrashIcon data-icon="inline-start" />
                  移除
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Field>

      <Button onClick={onSubmit} disabled={isLoading || uploading || !value.topic.trim()} className="w-fit">
        {isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : uploading ? <UploadIcon data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
        生成 PPT 架构
      </Button>
    </FieldGroup>
  )
}
