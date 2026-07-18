"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { logout } from "@/lib/api"
import { loadSessionSnapshot } from "@/lib/auth-bootstrap"
import { findPage, getDefaultPage, isAdminPage, isPageVisible, pageIdToPath, pathToPageId, type AppPageId } from "@/lib/navigation"
import type { EffectiveQuota, User } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"

const SetupWizard = dynamic(() => import("@/components/setup-wizard").then((mod) => mod.SetupWizard), {
  loading: () => <ShellLoading label="正在加载初始化向导..." />,
})

type AppState = "loading" | "setup" | "login" | "ready"

type AppShellContextValue = {
  user: User
  quota: EffectiveQuota | null
  setQuota: (quota: EffectiveQuota | null) => void
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null)

export function useAppShell() {
  const context = React.useContext(AppShellContext)
  if (!context) {
    throw new Error("useAppShell must be used within AppShell")
  }
  return context
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = React.useState<AppState>("loading")
  const [user, setUser] = React.useState<User | null>(null)
  const [quota, setQuota] = React.useState<EffectiveQuota | null>(null)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const snapshot = await loadSessionSnapshot({ includeQuota: true })
        if (!active) return
        if (snapshot.status === "setup") {
          setState("setup")
          return
        }
        if (snapshot.status === "authenticated") {
          setUser(snapshot.user)
          setQuota(snapshot.quota)
          setState("ready")
          return
        }
        router.replace("/login")
        setState("login")
      } catch (err) {
        if (!active) return
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
      setQuota(null)
      setState("login")
      router.push("/login")
    }
  }

  if (state === "loading") {
    return <ShellSkeleton />
  }

  if (state === "setup") {
    return (
      <SetupWizard
        onReady={(nextUser) => {
          setUser(nextUser)
          setState("ready")
          router.replace("/workspace")
        }}
      />
    )
  }

  if (state === "login") {
    return <ShellLoading label="正在跳转登录页..." />
  }

  if (!user) {
    return null
  }

  const activePage = pathToPageId(pathname)
  const effectivePage = isPageVisible(activePage, user.role) ? activePage : getDefaultPage()
  const pageMeta = findPage(effectivePage)

  function handlePageChange(page: AppPageId) {
    router.push(pageIdToPath(page))
  }

  const content = isAdminPage(activePage) && user.role !== "admin" ? <UnauthorizedAlert /> : children

  return (
    <AppShellContext.Provider value={{ user, quota, setQuota }}>
      <TooltipProvider>
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
            quota={quota}
            activePage={effectivePage}
            onPageChange={handlePageChange}
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
                {content}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AppShellContext.Provider>
  )
}

function ShellSkeleton() {
  return (
    <main className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <aside className="hidden w-72 shrink-0 border-r p-4 md:flex md:flex-col">
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-5/6 rounded-lg" />
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </section>
      </div>
    </main>
  )
}

function ShellLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="animate-spin" />
        {label}
      </div>
    </main>
  )
}

function UnauthorizedAlert() {
  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
      <AlertCircleIcon />
      <AlertTitle className="text-sm font-semibold">无权限访问</AlertTitle>
      <AlertDescription className="mt-1 text-sm">当前账号没有后台管理权限。</AlertDescription>
    </Alert>
  )
}
