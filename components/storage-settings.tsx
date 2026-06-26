"use client"

import * as React from "react"
import { toast } from "sonner"
import { getAdminStorage, switchAdminStorage, testAdminStorage } from "@/lib/api"
import type { StorageConfig, StorageKind, SupportedStorageOption } from "@/lib/types"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircleIcon, CheckCircle2Icon, DatabaseIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react"

const fallbackOptions: SupportedStorageOption[] = [
  { kind: "json", label: "JSON 文件", status: "supported", defaultPath: "data/app.json", description: "简单、无需数据库服务，适合本地或单机部署。" },
  { kind: "sqlite", label: "SQLite", status: "supported", defaultPath: "data/app.db", description: "单文件数据库，推荐小型部署。" },
  { kind: "postgres", label: "PostgreSQL", status: "advanced", description: "适合长期和多人部署，需要提供 PostgreSQL DSN。" },
  { kind: "mysql", label: "MySQL", status: "comingSoon", description: "当前版本暂不支持。" },
  { kind: "redis", label: "Redis", status: "notPrimaryStore", description: "Redis 当前不支持作为主数据存储。" },
]

function defaultStorageFor(kind: StorageKind, options: SupportedStorageOption[]): StorageConfig {
  const option = options.find((item) => item.kind === kind)
  if (kind === "json" || kind === "sqlite") {
    return { kind, path: option?.defaultPath || (kind === "json" ? "data/app.json" : "data/app.db") }
  }
  return { kind, dsn: "" }
}

function isSelectable(option?: SupportedStorageOption) {
  return option?.status === "supported" || option?.status === "advanced"
}

function statusLabel(status: SupportedStorageOption["status"]) {
  switch (status) {
    case "supported":
      return "支持"
    case "advanced":
      return "高级"
    case "comingSoon":
      return "即将支持"
    case "notPrimaryStore":
      return "非主存储"
  }
}

function storageValue(storage?: StorageConfig) {
  if (!storage) {
    return "未配置"
  }
  return storage.path || storage.dsn || "未填写"
}

export function StorageSettings() {
  const [currentStorage, setCurrentStorage] = React.useState<StorageConfig | undefined>()
  const [options, setOptions] = React.useState<SupportedStorageOption[]>(fallbackOptions)
  const [target, setTarget] = React.useState<StorageConfig>({ kind: "json", path: "data/app.json" })
  const [error, setError] = React.useState<unknown>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [tested, setTested] = React.useState(false)

  async function loadStorage() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getAdminStorage()
      const nextOptions = response.supportedStorage?.length ? response.supportedStorage : fallbackOptions
      setOptions(nextOptions)
      setCurrentStorage(response.storage)
      setTarget(defaultStorageFor(response.storage?.kind === "sqlite" ? "json" : "sqlite", nextOptions))
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "加载存储配置失败")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load storage status once after mount
    void loadStorage()
  }, [])

  function handleKindChange(value: string) {
    setTarget(defaultStorageFor(value as StorageKind, options))
    setTested(false)
  }

  async function handleTest() {
    setError(null)
    setIsTesting(true)
    try {
      await testAdminStorage(target)
      setTested(true)
      toast.success("目标存储连接测试成功")
    } catch (err) {
      setTested(false)
      setError(err)
      toast.error(err instanceof Error ? err.message : "目标存储测试失败")
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSwitch() {
    if (!window.confirm("确认切换主数据存储？系统会迁移用户和角色模型配置，建议先备份当前数据。")) {
      return
    }
    setError(null)
    setIsSwitching(true)
    try {
      const response = await switchAdminStorage(target)
      setCurrentStorage(response.storage)
      setTested(false)
      toast.success("存储已切换")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "存储切换失败")
    } finally {
      setIsSwitching(false)
    }
  }

  const selectedOption = options.find((item) => item.kind === target.kind)
  const selectable = isSelectable(selectedOption)
  const needsPath = target.kind === "json" || target.kind === "sqlite"

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon />
            当前存储
          </CardTitle>
          <CardDescription>查看当前主数据存储方式。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="animate-spin" />
                正在加载...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currentStorage?.kind || "unknown"}</Badge>
                  <span className="truncate text-muted-foreground">{storageValue(currentStorage)}</span>
                </div>
                <p className="text-muted-foreground">DSN 如包含密码，后端会在返回时自动脱敏。</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>切换存储</CardTitle>
          <CardDescription>迁移用户和角色模型配置到目标存储；不会删除旧存储数据。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {error ? <DebugErrorAlert title="操作失败" error={error} /> : null}
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>切换前请备份</AlertTitle>
              <AlertDescription>切换会迁移用户和角色模型配置，不迁移历史会话。失败时会保留旧存储。</AlertDescription>
            </Alert>
            <Field>
              <FieldLabel>目标存储方式</FieldLabel>
              <Select value={target.kind} onValueChange={handleKindChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择目标存储" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.map((option) => (
                      <SelectItem key={option.kind} value={option.kind} disabled={!isSelectable(option)}>
                        {option.label} · {statusLabel(option.status)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{selectedOption?.description}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="storage-target-value">{needsPath ? "文件路径" : "连接 DSN"}</FieldLabel>
              <Input
                id="storage-target-value"
                value={needsPath ? target.path || "" : target.dsn || ""}
                onChange={(event) => {
                  setTarget((current) => needsPath ? { ...current, path: event.target.value } : { ...current, dsn: event.target.value })
                  setTested(false)
                }}
                disabled={!selectable}
                placeholder={needsPath ? selectedOption?.defaultPath : "postgres://user:pass@host:5432/db?sslmode=disable"}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleTest} disabled={!selectable || isTesting || isSwitching}>
                {isTesting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckCircle2Icon data-icon="inline-start" />}
                测试连接
              </Button>
              <Button type="button" onClick={handleSwitch} disabled={!selectable || isTesting || isSwitching}>
                {isSwitching ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}
                迁移并切换
              </Button>
              {tested ? <Badge variant="default">测试通过</Badge> : <Badge variant="outline">建议先测试</Badge>}
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
