"use client"

import * as React from "react"
import { toast } from "sonner"
import { getAgentWorkflow, listLLMProviders, listProviderModels, resetAgentWorkflow, saveAgentWorkflow } from "@/lib/api"
import type { AgentWorkflow, AgentWorkflowStep, LLMModelInfo, LLMProvider } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, PlusIcon, RotateCcwIcon, SaveIcon, TrashIcon } from "lucide-react"

const kindOptions = [
  { value: "vision", label: "视觉理解（图片/PDF）" },
  { value: "search", label: "联网/实时检索" },
  { value: "summarize", label: "上下文汇总" },
  { value: "outline", label: "生成 PPT 大纲" },
]

const conditionOptions = [
  { value: "always", label: "始终执行" },
  { value: "has_files", label: "有上传文件时" },
  { value: "needs_search", label: "需要实时/未知信息时" },
]

function newStep(kind = "search"): AgentWorkflowStep {
  const meta = kindOptions.find((k) => k.value === kind)
  return {
    id: `${kind}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    name: meta?.label || kind,
    enabled: true,
    condition: kind === "vision" ? "has_files" : kind === "search" ? "needs_search" : "always",
    providerId: "",
    model: "",
    systemPrompt: "",
    requestJson: kind === "search" ? '{\n  "tools": [{"type": "web_search"}]\n}' : "",
  }
}

export function AgentWorkflowSettings() {
  const [workflow, setWorkflow] = React.useState<AgentWorkflow | null>(null)
  const [providers, setProviders] = React.useState<LLMProvider[]>([])
  const [models, setModels] = React.useState<Record<string, LLMModelInfo[]>>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const [wf, prov] = await Promise.all([getAgentWorkflow(), listLLMProviders().catch(() => ({ providers: [] as LLMProvider[] }))])
      setWorkflow(wf.workflow)
      setProviders((prov.providers || []).filter((p) => p.enabled))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载 Agent 配置失败")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin settings bootstrap
    void load()
  }, [])

  async function ensureModels(providerId: string) {
    if (!providerId || models[providerId]) return
    try {
      const res = await listProviderModels(providerId)
      setModels((m) => ({ ...m, [providerId]: res.models || [] }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "拉取模型失败")
    }
  }

  function updateStep(index: number, patch: Partial<AgentWorkflowStep>) {
    setWorkflow((wf) => {
      if (!wf) return wf
      const steps = wf.steps.map((s, i) => (i === index ? { ...s, ...patch } : s))
      return { ...wf, steps }
    })
  }

  async function handleSave() {
    if (!workflow) return
    setSaving(true)
    try {
      const res = await saveAgentWorkflow(workflow)
      setWorkflow(res.workflow)
      toast.success("Agent workflow 已保存")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm("确认恢复默认 Agent workflow？")) return
    setSaving(true)
    try {
      const res = await resetAgentWorkflow()
      setWorkflow(res.workflow)
      toast.success("已恢复默认 workflow")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "恢复失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !workflow) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2Icon className="animate-spin" /> 正在加载 Agent 配置…
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>架构师 Agent Workflow</CardTitle>
            <CardDescription>
              将 PPT 架构师升级为多步骤 Agent：上传材料视觉理解、实时检索、上下文汇总，最后生成大纲。
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void handleReset()} disabled={saving}>
              <RotateCcwIcon data-icon="inline-start" /> 恢复默认
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              保存
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Workflow 名称</FieldLabel>
              <Input value={workflow.name} onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })} />
            </Field>
          </FieldGroup>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">步骤按顺序执行；可用条件控制是否跳过。</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkflow({ ...workflow, steps: [...workflow.steps, newStep("search")] })}
            >
              <PlusIcon data-icon="inline-start" /> 添加步骤
            </Button>
          </div>
        </CardContent>
      </Card>

      {workflow.steps.map((step, index) => (
        <Card key={step.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">步骤 {index + 1}</CardTitle>
              <Badge variant="secondary">{step.kind}</Badge>
              {!step.enabled ? <Badge variant="outline">已禁用</Badge> : null}
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setWorkflow({ ...workflow, steps: workflow.steps.filter((_, i) => i !== index) })}
            >
              <TrashIcon data-icon="inline-start" /> 删除
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>名称</FieldLabel>
                <Input value={step.name} onChange={(e) => updateStep(index, { name: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel>类型</FieldLabel>
                <Select value={step.kind} onValueChange={(kind) => updateStep(index, { kind })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {kindOptions.map((k) => (
                        <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>执行条件</FieldLabel>
                <Select value={step.condition || "always"} onValueChange={(condition) => updateStep(index, { condition })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {conditionOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>启用</FieldLabel>
                <div className="flex h-9 items-center gap-2 rounded-md border px-3">
                  <Input
                    type="checkbox"
                    className="size-4"
                    checked={step.enabled}
                    onChange={(e) => updateStep(index, { enabled: e.target.checked })}
                  />
                  <span className="text-sm">{step.enabled ? "启用" : "禁用"}</span>
                </div>
              </Field>
              <Field>
                <FieldLabel>LLM 提供商（可空=跟随架构师）</FieldLabel>
                <Select
                  value={step.providerId || "__inherit__"}
                  onValueChange={(v) => {
                    const providerId = v === "__inherit__" ? "" : v
                    updateStep(index, { providerId, model: "" })
                    if (providerId) void ensureModels(providerId)
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="继承架构师" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__inherit__">继承架构师角色</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} · {p.kind}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>模型（可空=跟随架构师）</FieldLabel>
                <Select
                  value={step.model || "__inherit__"}
                  onValueChange={(v) => updateStep(index, { model: v === "__inherit__" ? "" : v })}
                  disabled={!step.providerId}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="继承架构师" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__inherit__">继承架构师</SelectItem>
                      {(models[step.providerId || ""] || (step.model ? [{ id: step.model, name: step.model }] : [])).map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name || m.id}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>步骤 System Prompt（可空）</FieldLabel>
                <Textarea
                  className="min-h-28 font-mono text-xs"
                  value={step.systemPrompt || ""}
                  onChange={(e) => updateStep(index, { systemPrompt: e.target.value })}
                />
                <FieldDescription>outline 步骤为空时使用“角色模型”里的架构师提示词。</FieldDescription>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>请求 JSON 增量（可空）</FieldLabel>
                <Textarea
                  className="min-h-24 font-mono text-xs"
                  value={step.requestJson || ""}
                  onChange={(e) => updateStep(index, { requestJson: e.target.value })}
                  placeholder='{"tools":[{"type":"web_search"}]}'
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
