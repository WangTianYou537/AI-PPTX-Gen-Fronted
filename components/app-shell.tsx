"use client"

import * as React from "react"
import { toast } from "sonner"
import { getMe, getSetupStatus, logout } from "@/lib/api"
import type { User } from "@/lib/types"
import { AdminPanel } from "@/components/admin-panel"
import { LoginForm } from "@/components/login-form"
import { PPTWorkspace } from "@/components/ppt-workspace"
import { SetupWizard } from "@/components/setup-wizard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircleIcon, Loader2Icon, LogOutIcon, SettingsIcon, WandSparklesIcon } from "lucide-react"

type AppState = "loading" | "setup" | "login" | "ready"

export function AppShell() {
  const [state, setState] = React.useState<AppState>("loading")
  const [user, setUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const setup = await getSetupStatus()
        if (!active) {
          return
        }
        if (setup.needsSetup) {
          setState("setup")
          return
        }
        try {
          const me = await getMe()
          if (!active) {
            return
          }
          setUser(me.user)
          setState("ready")
        } catch {
          if (active) {
            setState("login")
          }
        }
      } catch (err) {
        if (!active) {
          return
        }
        setError(err instanceof Error ? err.message : "加载失败")
        setState("login")
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  async function handleLogout() {
    try {
      await logout()
      toast.success("已退出登录")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "退出失败")
    } finally {
      setUser(null)
      setState("login")
    }
  }

  if (state === "loading") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="animate-spin" />
          正在加载...
        </div>
      </main>
    )
  }

  if (state === "setup") {
    return <SetupWizard onReady={(nextUser) => { setUser(nextUser); setState("ready") }} />
  }

  if (state === "login") {
    return <LoginForm onLogin={(nextUser) => { setUser(nextUser); setState("ready") }} />
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">AI PPT Generator</Badge>
              <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">AI 生成 PPT 工作台</h1>
              <p className="text-muted-foreground">当前用户：{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            退出登录
          </Button>
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>加载提示</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="workspace">
          <TabsList>
            <TabsTrigger value="workspace">
              <WandSparklesIcon data-icon="inline-start" />
              工作台
            </TabsTrigger>
            {user.role === "admin" ? (
              <TabsTrigger value="admin">
                <SettingsIcon data-icon="inline-start" />
                后台管理
              </TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="workspace">
            <PPTWorkspace compact />
          </TabsContent>
          {user.role === "admin" ? (
            <TabsContent value="admin">
              <AdminPanel currentUser={user} />
            </TabsContent>
          ) : null}
        </Tabs>
      </section>
    </main>
  )
}
