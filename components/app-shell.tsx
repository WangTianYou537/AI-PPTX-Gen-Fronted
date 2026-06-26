"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getMe, getSetupStatus, logout } from "@/lib/api"
import { findPage, getDefaultPage, isPageVisible, type AppPageId } from "@/lib/navigation"
import type { User } from "@/lib/types"
import { AppPageRenderer } from "@/components/app-page-renderer"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SetupWizard } from "@/components/setup-wizard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"

type AppState = "loading" | "setup" | "login" | "ready"

export function AppShell() {
  const router = useRouter()
  const [state, setState] = React.useState<AppState>("loading")
  const [user, setUser] = React.useState<User | null>(null)
  const [activePage, setActivePage] = React.useState<AppPageId>("workspace.overview")
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
            router.replace("/login")
            setState("login")
          }
        }
      } catch (err) {
        if (!active) {
          return
        }
        router.replace("/login")
        setError(err instanceof Error ? err.message : "加载失败")
        setState("login")
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [router])

  async function handleLogout() {
    try {
      await logout()
      toast.success("已退出登录")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "退出失败")
    } finally {
      setUser(null)
      setActivePage("workspace.overview")
      setState("login")
      router.push("/login")
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
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="animate-spin" />
          正在跳转登录页...
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  const effectivePage = isPageVisible(activePage, user.role) ? activePage : getDefaultPage()
  const pageMeta = findPage(effectivePage)

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
        activePage={effectivePage}
        onPageChange={setActivePage}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <DashboardHeader page={pageMeta} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>加载提示</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {/* 🚀 传入 onPageChange，让页面渲染器有能力更新侧栏高亮状态 */}
            <AppPageRenderer page={effectivePage} user={user} onPageChange={setActivePage} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
