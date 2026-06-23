"use client"

import type { ApiConfig, Provider } from "@/lib/types"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const providerDefaults: Record<Provider, Pick<ApiConfig, "baseURL" | "model">> = {
  openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4.1" },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.5-pro",
  },
  claude: { baseURL: "https://api.anthropic.com/v1", model: "claude-opus-4-8" },
}

type APIConfigPanelProps = {
  config: ApiConfig
  onChange: (config: ApiConfig) => void
}

export function APIConfigPanel({ config, onChange }: APIConfigPanelProps) {
  function updateProvider(provider: Provider) {
    onChange({
      ...config,
      provider,
      baseURL: providerDefaults[provider].baseURL,
      model: providerDefaults[provider].model,
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>模型格式</FieldLabel>
        <Select value={config.provider} onValueChange={(value) => updateProvider(value as Provider)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择模型格式" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="openai">OpenAI / 兼容格式</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>API Key 只发送给本地 Go 后端，不会保存在后端。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="api-key">API Key</FieldLabel>
        <Input
          id="api-key"
          type="password"
          value={config.apiKey}
          placeholder="sk-..."
          onChange={(event) => onChange({ ...config, apiKey: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="base-url">Base URL</FieldLabel>
        <Input
          id="base-url"
          value={config.baseURL}
          onChange={(event) => onChange({ ...config, baseURL: event.target.value })}
        />
        <FieldDescription>OpenAI 兼容服务可在这里填写自定义地址。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="model">模型名称</FieldLabel>
        <Input
          id="model"
          value={config.model}
          onChange={(event) => onChange({ ...config, model: event.target.value })}
        />
      </Field>
    </FieldGroup>
  )
}
