"use client"

import * as React from "react"
import { toast } from "sonner"
import { getMe, getSetupStatus, logout } from "@/lib/api"
import type { User } from "@/lib/types"
import { AdminPanel } from "@/components/admin-panel"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { LoginForm } from "@/components/login-form"
import { PPTWorkspace } from "@/components/ppt-workspace"
import { SetupWizard } from "@/components/setup-wizard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"

type AppState = "loading" | "setup" | "login" | "ready"
type DashboardSection = "workspace" | "admin"

export function AppShell() {
  const [state, setState] = React.useState<AppState>("loading")
  const [user, setUser] = React.useState<User | null>(null)
  const [activeSection, setActiveSection] = React.useState<DashboardSection>("workspace")
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
      setActiveSection("workspace")
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

  const effectiveSection: DashboardSection = user.role === "admin" ? activeSection : "workspace"
  const pageMeta = effectiveSection === "admin"
    ? {
        title: "后台管理",
        description: "管理用户账号、生成角色模型和系统提示词。",
      }
    : {
        title: "AI 生成 PPT 工作台",
        description: "输入主题，审核架构，生成 SVG 页面并导出 PPTX。",
      }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <DashboardSidebar
        variant="inset"
        user={user}
        activeSection={effectiveSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <DashboardHeader title={pageMeta.title} description={pageMeta.description} user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>加载提示</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {effectiveSection === "admin" && user.role === "admin" ? (
              <AdminPanel currentUser={user} />
            ) : (
              <PPTWorkspace compact />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
