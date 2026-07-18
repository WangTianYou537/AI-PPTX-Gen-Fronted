"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  createLLMProvider,
  deleteLLMProvider,
  listLLMProviders,
  listProviderModels,
  updateLLMProvider,
} from "@/lib/api"
import type { LLMModelInfo, LLMProvider, Provider } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2Icon, PlusIcon, RefreshCcwIcon, SaveIcon, TrashIcon } from "lucide-react"

const kindDefaults: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  "openai-responses": "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  claude: "https://api.anthropic.com/v1",
}

const kindLabels: Record<Provider, string> = {
  openai: "OpenAI Chat Completions",
  "openai-responses": "OpenAI Responses",
  gemini: "Gemini",
  claude: "Claude",
}

export function ProviderSettingsPanel() {
  const [providers, setProviders] = React.useState<LLMProvider[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [models, setModels] = React.useState<Record<string, LLMModelInfo[]>>({})
  const [form, setForm] = React.useState({ name: "", kind: "openai" as Provider, baseURL: kindDefaults.openai, apiKey: "", enabled: true })

  async function load() {
    setLoading(true)
    try {
      const res = await listLLMProviders()
      setProviders(res.providers || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载提供商失败")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load providers once after mount
    void load()
  }, [])

  async function handleCreate() {
    if (!form.name.trim() || !form.apiKey.trim()) {
      toast.error("请填写名称和 API Key")
      return
    }
    setSaving(true)
    try {
      await createLLMProvider({
        name: form.name.trim(),
        kind: form.kind,
        baseURL: form.baseURL.trim(),
        apiKey: form.apiKey.trim(),
        enabled: form.enabled,
      })
      toast.success("提供商已创建")
      setForm({ name: "", kind: "openai", baseURL: kindDefaults.openai, apiKey: "", enabled: true })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSaving(false)
    }
  }

  async function handleFetchModels(provider: LLMProvider) {
    try {
      const res = await listProviderModels(provider.id)
      setModels((current) => ({ ...current, [provider.id]: res.models || [] }))
      toast.success(`已拉取 ${res.models?.length || 0} 个模型`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "拉取模型失败")
    }
  }

  async function handleToggle(provider: LLMProvider) {
    try {
      await updateLLMProvider(provider.id, { enabled: !provider.enabled })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    }
  }

  async function handleDelete(provider: LLMProvider) {
    if (!window.confirm(`确认删除提供商「${provider.name}」？`)) return
    try {
      await deleteLLMProvider(provider.id)
      toast.success("已删除")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>新增 LLM 提供商</CardTitle>
          <CardDescription>配置站点地址和 API Key。OpenAI 可选 Chat Completions 或 Responses 接口。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>名称</FieldLabel>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="例如：OpenAI 官方 / 中转站 A" />
            </Field>
            <Field>
              <FieldLabel>类型</FieldLabel>
              <Select
                value={form.kind}
                onValueChange={(kind) =>
                  setForm((f) => ({
                    ...f,
                    kind: kind as Provider,
                    baseURL: kindDefaults[kind as Provider],
                  }))
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="openai">OpenAI Chat Completions</SelectItem>
                    <SelectItem value="openai-responses">OpenAI Responses</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Base URL / 站点</FieldLabel>
              <Input value={form.baseURL} onChange={(e) => setForm((f) => ({ ...f, baseURL: e.target.value }))} placeholder="https://api.openai.com/v1" />
              <FieldDescription>支持官方地址或兼容中转站。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>API Key</FieldLabel>
              <Input type="password" value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} />
            </Field>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
              添加提供商
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已配置提供商</CardTitle>
          <CardDescription>{loading ? "加载中..." : `共 ${providers.length} 个`}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{provider.name}</p>
                    <Badge variant={provider.enabled ? "default" : "outline"}>{provider.enabled ? "启用" : "禁用"}</Badge>
                    <Badge variant="secondary">{kindLabels[provider.kind] || provider.kind}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{provider.baseURL || "默认站点"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Key: {provider.apiKey || "未显示"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleFetchModels(provider)}>
                    <RefreshCcwIcon data-icon="inline-start" />
                    拉取模型
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(provider)}>
                    <SaveIcon data-icon="inline-start" />
                    {provider.enabled ? "禁用" : "启用"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(provider)}>
                    <TrashIcon data-icon="inline-start" />
                    删除
                  </Button>
                </div>
              </div>
              {models[provider.id]?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {models[provider.id].slice(0, 24).map((model) => (
                    <Badge key={model.id} variant="outline">{model.name || model.id}</Badge>
                  ))}
                  {models[provider.id].length > 24 ? <Badge variant="secondary">+{models[provider.id].length - 24}</Badge> : null}
                </div>
              ) : null}
            </div>
          ))}
          {!loading && providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有提供商，请先在左侧添加。</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
