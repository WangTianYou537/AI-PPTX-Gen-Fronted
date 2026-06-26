"use client"

import * as React from "react"
import { toast } from "sonner"
import { getPrompts, resetPrompts, savePrompts } from "@/lib/api"
import type { GenerationRoleSettings, ModelConfig, PromptSettings, Provider } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircleIcon, Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react"

const providerDefaults: Record<Provider, Pick<ModelConfig, "baseURL" | "model">> = {
  openai: { baseURL: "https://api.openai.com/v1", model: "gpt-5.5" },
  gemini: { baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-3.5-flash" },
  claude: { baseURL: "https://api.anthropic.com/v1", model: "claude-opus-4-8" },
}

const emptyRoleSettings: GenerationRoleSettings = {
  systemPrompt: "",
  supportsTools: false,
  modelConfig: {
    provider: "claude",
    apiKey: "",
    baseURL: "https://api.anthropic.com/v1",
    model: "claude-opus-4-8",
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

  async function loadPrompts() {
    setIsLoading(true)
    setError("")
    try {
      const nextSettings = await getPrompts()
      setSettings(normalizeSettings(nextSettings))
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

  function updateModel(role: "architect" | "svg", patch: Partial<ModelConfig>) {
    setSettings((current) => ({
      ...current,
      [role]: {
        ...current[role],
        modelConfig: {
          ...current[role].modelConfig,
          ...patch,
        },
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
    if (!window.confirm("确认恢复默认提示词？模型和 API Key 会保留。")) {
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
        <CardDescription>分别配置 PPT 架构师和 PPT-SVG 生成器使用的模型、API Key 和系统提示词。</CardDescription>
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
                onRoleChange={(patch) => updateRole("architect", patch)}
                onModelChange={(patch) => updateModel("architect", patch)}
              />
            </TabsContent>
            <TabsContent value="svg">
              <RoleSettingsForm
                title="PPT-SVG 生成器"
                value={settings.svg}
                disabled={isLoading || isSaving}
                onRoleChange={(patch) => updateRole("svg", patch)}
                onModelChange={(patch) => updateModel("svg", patch)}
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

type RoleSettingsFormProps = {
  title: string
  value: GenerationRoleSettings
  disabled: boolean
  onRoleChange: (patch: Partial<GenerationRoleSettings>) => void
  onModelChange: (patch: Partial<ModelConfig>) => void
}

function RoleSettingsForm({ title, value, disabled, onRoleChange, onModelChange }: RoleSettingsFormProps) {
  function handleProviderChange(provider: Provider) {
    onModelChange({
      provider,
      baseURL: providerDefaults[provider].baseURL,
      model: providerDefaults[provider].model,
    })
  }

  return (
    <div className="mt-4 flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>{title} Provider</FieldLabel>
          <Select value={value.modelConfig.provider} onValueChange={(provider) => handleProviderChange(provider as Provider)} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="openai">OpenAI / 兼容格式</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${title}-model`}>模型名称</FieldLabel>
          <Input
            id={`${title}-model`}
            value={value.modelConfig.model}
            onChange={(event) => onModelChange({ model: event.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${title}-api-key`}>API Key</FieldLabel>
          <Input
            id={`${title}-api-key`}
            type="password"
            value={value.modelConfig.apiKey}
            onChange={(event) => onModelChange({ apiKey: event.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${title}-base-url`}>Base URL</FieldLabel>
          <Input
            id={`${title}-base-url`}
            value={value.modelConfig.baseURL}
            onChange={(event) => onModelChange({ baseURL: event.target.value })}
            disabled={disabled}
          />
          <FieldDescription>可留空使用后端 provider 默认地址。</FieldDescription>
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
    modelConfig: {
      ...emptyRoleSettings.modelConfig,
      ...role?.modelConfig,
    },
  }
}
