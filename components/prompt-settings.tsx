"use client"

import * as React from "react"
import { toast } from "sonner"
import { getPrompts, listLLMProviders, listProviderModels, resetPrompts, savePrompts } from "@/lib/api"
import type { GenerationRoleSettings, LLMModelInfo, LLMProvider, PromptSettings } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircleIcon, Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react"


const emptyRoleSettings: GenerationRoleSettings = {
  systemPrompt: "",
  supportsTools: false,
  requestJson: "",
  providerId: "",
  model: "",
  modelConfig: {
    provider: "openai",
    apiKey: "",
    baseURL: "",
    model: "",
  },
}

export function PromptSettingsPanel() {
  const [settings, setSettings] = React.useState<PromptSettings>({
    architect: emptyRoleSettings,
    svg: emptyRoleSettings,
    updatedAt: "",
    updatedBy: "",
  })
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [providers, setProviders] = React.useState<LLMProvider[]>([])
  const [modelsByProvider, setModelsByProvider] = React.useState<Record<string, LLMModelInfo[]>>({})

  async function loadPrompts() {
    setIsLoading(true)
    setError("")
    try {
      const [nextSettings, providerRes] = await Promise.all([getPrompts(), listLLMProviders().catch(() => ({ providers: [] as LLMProvider[] }))])
      setSettings(normalizeSettings(nextSettings))
      setProviders(providerRes.providers || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载角色模型失败"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load admin role settings once after mount
    void loadPrompts()
  }, [])

  function updateRole(role: "architect" | "svg", patch: Partial<GenerationRoleSettings>) {
    setSettings((current) => ({
      ...current,
      [role]: {
        ...current[role],
        ...patch,
      },
    }))
  }


  async function handleSave() {
    setIsSaving(true)
    try {
      const nextSettings = await savePrompts(settings)
      setSettings(normalizeSettings(nextSettings))
      toast.success("角色模型已保存")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm("确认恢复默认提示词？提供商与模型绑定会保留。")) {
      return
    }
    setIsSaving(true)
    try {
      const nextSettings = await resetPrompts()
      setSettings(normalizeSettings(nextSettings))
      toast.success("已恢复默认提示词")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "恢复失败")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成角色模型</CardTitle>
        <CardDescription>为架构师和页面生成器绑定 LLM 提供商与模型（不支持旧版手动填写 API Key）。</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Alert>
            <AlertCircleIcon />
            <AlertTitle>工具调用兼容模式</AlertTitle>
            <AlertDescription>如果模型支持 Tools / Function Calling，建议为 SVG 生成器开启，可通过 show_svg 工具返回 base64 SVG，显著减少 JSON 转义错误。不支持时后端会自动追加纯 SVG 输出提示词。</AlertDescription>
          </Alert>
          <Tabs defaultValue="architect">
            <TabsList>
              <TabsTrigger value="architect">PPT 架构师</TabsTrigger>
              <TabsTrigger value="svg">PPT-SVG 生成器</TabsTrigger>
            </TabsList>
            <TabsContent value="architect">
              <RoleSettingsForm
                title="PPT 架构师"
                value={settings.architect}
                disabled={isLoading || isSaving}
                providers={providers}
                models={modelsByProvider[settings.architect.providerId || ""] || []}
                onLoadModels={async (providerId) => {
                  if (!providerId || modelsByProvider[providerId]) return
                  try {
                    const res = await listProviderModels(providerId)
                    setModelsByProvider((current) => ({ ...current, [providerId]: res.models || [] }))
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "拉取模型失败")
                  }
                }}
                onRoleChange={(patch) => updateRole("architect", patch)}
              />
            </TabsContent>
            <TabsContent value="svg">
              <RoleSettingsForm
                title="PPT-SVG 生成器"
                value={settings.svg}
                disabled={isLoading || isSaving}
                providers={providers}
                models={modelsByProvider[settings.svg.providerId || ""] || []}
                onLoadModels={async (providerId) => {
                  if (!providerId || modelsByProvider[providerId]) return
                  try {
                    const res = await listProviderModels(providerId)
                    setModelsByProvider((current) => ({ ...current, [providerId]: res.models || [] }))
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "拉取模型失败")
                  }
                }}
                onRoleChange={(patch) => updateRole("svg", patch)}
              />
            </TabsContent>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              保存角色模型
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSaving || isLoading}>
              <RotateCcwIcon data-icon="inline-start" />
              恢复默认提示词
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}


function RoleSettingsForm({ title, value, disabled, providers, models, onLoadModels, onRoleChange }: {
  title: string
  value: GenerationRoleSettings
  disabled: boolean
  providers: LLMProvider[]
  models: LLMModelInfo[]
  onLoadModels: (providerId: string) => void
  onRoleChange: (patch: Partial<GenerationRoleSettings>) => void
}) {
  React.useEffect(() => {
    if (value.providerId) onLoadModels(value.providerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.providerId])

  const enabledProviders = providers.filter((p) => p.enabled)

  return (
    <div className="mt-4 flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>{title} LLM 提供商</FieldLabel>
          <Select
            value={value.providerId || undefined}
            onValueChange={(providerId) => {
              onRoleChange({ providerId, model: "" })
              onLoadModels(providerId)
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="请选择提供商" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {enabledProviders.length ? enabledProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · {p.kind}</SelectItem>
                )) : (
                  <SelectItem value="__none__" disabled>请先在「LLM 提供商」中添加</SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>必须先配置 LLM 提供商，再在此绑定提供商与模型。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>{title} 模型</FieldLabel>
          <Select
            value={value.model || undefined}
            onValueChange={(model) => onRoleChange({ model })}
            disabled={disabled || !value.providerId}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder={value.providerId ? "请选择模型" : "先选择提供商"} /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(models.length ? models : (value.model ? [{ id: value.model, name: value.model }] : [])).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name || m.id}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={`${title}-supports-tools`}>支持 Tools / Function Calling</FieldLabel>
            <FieldDescription>开启后会优先使用工具调用；关闭时自动使用兼容 prompt。</FieldDescription>
          </div>
          <Input
            id={`${title}-supports-tools`}
            type="checkbox"
            checked={value.supportsTools}
            onChange={(event) => onRoleChange({ supportsTools: event.target.checked })}
            disabled={disabled}
            className="size-4"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${title}-prompt`}>System Prompt</FieldLabel>
        <Textarea
          id={`${title}-prompt`}
          value={value.systemPrompt}
          onChange={(event) => onRoleChange({ systemPrompt: event.target.value })}
          className="min-h-72 font-mono text-xs"
          disabled={disabled}
        />
        <FieldDescription>必须约束模型输出严格 JSON，否则生成可能失败。</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${title}-request-json`}>请求 JSON 扩展</FieldLabel>
        <Textarea
          id={`${title}-request-json`}
          value={value.requestJson || ""}
          onChange={(event) => onRoleChange({ requestJson: event.target.value })}
          className="min-h-40 font-mono text-xs"
          disabled={disabled}
          placeholder={`{\n  "temperature": 0.2,\n  "max_tokens": 8192\n}`}
        />
        <FieldDescription>
          可选。会合并进实际发给 LLM 的请求体，用于补充 temperature、max_tokens 等 provider 扩展字段。请填写 JSON 对象；留空表示不额外覆盖。
        </FieldDescription>
      </Field>
    </div>
  )
}

function normalizeSettings(settings: PromptSettings): PromptSettings {
  return {
    ...settings,
    architect: normalizeRole(settings.architect),
    svg: normalizeRole(settings.svg),
  }
}

function normalizeRole(role: GenerationRoleSettings): GenerationRoleSettings {
  return {
    systemPrompt: role?.systemPrompt ?? "",
    supportsTools: role?.supportsTools ?? false,
    requestJson: role?.requestJson ?? "",
    providerId: role?.providerId ?? "",
    model: role?.model ?? "",
    modelConfig: {
      provider: "openai",
      apiKey: "",
      baseURL: "",
      model: role?.model ?? "",
    },
  }
}
