"use client"

import * as React from "react"
import { toast } from "sonner"
import { getSetupStatus, setupAdmin, testSetupStorage } from "@/lib/api"
import type { StorageConfig, StorageKind, SupportedStorageOption, User } from "@/lib/types"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2Icon, DatabaseIcon, Loader2Icon, SparklesIcon } from "lucide-react"

type SetupWizardProps = {
  onReady: (user: User) => void
}

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

function isSelectable(option?: SupportedStorageOption) {
  return option?.status === "supported" || option?.status === "advanced"
}

export function SetupWizard({ onReady }: SetupWizardProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [options, setOptions] = React.useState<SupportedStorageOption[]>(fallbackOptions)
  const [storage, setStorage] = React.useState<StorageConfig>({ kind: "json", path: "data/app.json" })
  const [storageConfigured, setStorageConfigured] = React.useState(false)
  const [storageTested, setStorageTested] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [isTesting, setIsTesting] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function loadSetupStatus() {
      try {
        const status = await getSetupStatus()
        if (!active) {
          return
        }
        const nextOptions = status.supportedStorage?.length ? status.supportedStorage : fallbackOptions
        setOptions(nextOptions)
        setStorageConfigured(Boolean(status.storageConfigured))
        if (status.storage) {
          setStorage(status.storage)
          setStorageTested(true)
        } else {
          setStorage(defaultStorageFor("json", nextOptions))
        }
      } catch (err) {
        if (active) {
          setError(err)
        }
      }
    }
    void loadSetupStatus()
    return () => {
      active = false
    }
  }, [])

  function handleKindChange(value: string) {
    const kind = value as StorageKind
    setStorage(defaultStorageFor(kind, options))
    setStorageTested(false)
  }

  async function handleTestStorage() {
    setError(null)
    setIsTesting(true)
    try {
      await testSetupStorage(storage)
      setStorageTested(true)
      toast.success("存储连接测试成功")
    } catch (err) {
      setStorageTested(false)
      setError(err)
      toast.error(err instanceof Error ? err.message : "存储连接测试失败")
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError(new Error("两次输入的密码不一致"))
      return
    }
    setIsSubmitting(true)
    try {
      const response = await setupAdmin(email, password, storageConfigured ? undefined : storage)
      toast.success("管理员已创建")
      onReady(response.user)
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "安装失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOption = options.find((item) => item.kind === storage.kind)
  const selectable = storageConfigured || isSelectable(selectedOption)
  const needsPath = storage.kind === "json" || storage.kind === "sqlite"

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>初始化 AI PPT Generator</CardTitle>
          <CardDescription>首次使用需要选择数据存储方式，并创建一个管理员账号。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error ? <DebugErrorAlert title="安装失败" error={error} /> : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DatabaseIcon />
                      数据存储
                    </CardTitle>
                    <CardDescription>JSON、SQLite、PostgreSQL 可用；MySQL 和 Redis 暂不作为主存储开放。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>存储方式</FieldLabel>
                        <Select value={storage.kind} onValueChange={handleKindChange} disabled={storageConfigured}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择存储方式" />
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
                        <FieldLabel htmlFor="setup-storage-value">{needsPath ? "文件路径" : "连接 DSN"}</FieldLabel>
                        <Input
                          id="setup-storage-value"
                          value={needsPath ? storage.path || "" : storage.dsn || ""}
                          onChange={(event) => {
                            setStorage((current) => needsPath ? { ...current, path: event.target.value } : { ...current, dsn: event.target.value })
                            setStorageTested(false)
                          }}
                          disabled={storageConfigured || !selectable}
                          placeholder={needsPath ? selectedOption?.defaultPath : "postgres://user:pass@host:5432/db?sslmode=disable"}
                        />
                      </Field>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" onClick={handleTestStorage} disabled={storageConfigured || !selectable || isTesting}>
                          {isTesting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckCircle2Icon data-icon="inline-start" />}
                          测试连接
                        </Button>
                        {storageConfigured ? <Badge variant="secondary">已配置</Badge> : storageTested ? <Badge variant="default">测试通过</Badge> : <Badge variant="outline">建议先测试</Badge>}
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">管理员账号</CardTitle>
                    <CardDescription>管理员可进入后台管理用户、模型和存储。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="setup-email">管理员邮箱</FieldLabel>
                        <Input id="setup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="setup-password">密码</FieldLabel>
                        <Input id="setup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                        <FieldDescription>至少 8 位。</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="setup-confirm-password">确认密码</FieldLabel>
                        <Input id="setup-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>

              <Button type="submit" disabled={isSubmitting || !email || !password || !selectable}>
                {isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
                完成安装
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
