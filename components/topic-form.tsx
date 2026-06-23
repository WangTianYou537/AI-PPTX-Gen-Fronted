"use client"

import type { TopicInput } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Loader2Icon, SparklesIcon } from "lucide-react"

type TopicFormProps = {
  value: TopicInput
  isLoading: boolean
  onChange: (value: TopicInput) => void
  onSubmit: () => void
}

export function TopicForm({ value, isLoading, onChange, onSubmit }: TopicFormProps) {
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

      <Button onClick={onSubmit} disabled={isLoading || !value.topic.trim()} className="w-fit">
        {isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
        生成 PPT 架构
      </Button>
    </FieldGroup>
  )
}
