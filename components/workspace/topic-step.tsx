"use client"

import type { TopicInput } from "@/lib/types"
import { TopicForm } from "@/components/topic-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function WorkspaceTopicStep({
  topic,
  isLoading,
  onChange,
  onSubmit,
}: {
  topic: TopicInput
  isLoading: boolean
  onChange: (topic: TopicInput) => void
  onSubmit: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-5">
          <CardTitle className="text-lg font-semibold">输入演示主题</CardTitle>
          <CardDescription className="mt-1 text-sm leading-relaxed">
            告诉 PPT 架构师你想表达什么、受众是谁、希望生成几页。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicForm value={topic} isLoading={isLoading} onChange={onChange} onSubmit={onSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
