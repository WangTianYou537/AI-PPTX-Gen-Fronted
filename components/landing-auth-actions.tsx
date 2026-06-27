"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon, Loader2Icon, LogInIcon, UserPlusIcon } from "lucide-react"
import { getMe } from "@/lib/api"
import { Button } from "@/components/ui/button"

type LandingState = "checking" | "authenticated" | "anonymous"

export function LandingAuthActions() {
  const [state, setState] = React.useState<LandingState>("checking")

  React.useEffect(() => {
    let active = true

     async function checkAuth() {
    try {
      await getMe()
      if (active) {
        setState("authenticated")
      }
    } catch {
      if (active) {
        setState("anonymous")
      }
    }
  }

    void checkAuth()
    return () => {
      active = false
    }
  }, [])

  if (state === "checking") {
    return (
      <Button size="lg" variant="outline" disabled>
        <Loader2Icon data-icon="inline-start" className="animate-spin" />
        检查登录状态...
      </Button>
    )
  }

  if (state === "authenticated") {
    return (
      <Button size="lg" asChild>
        <Link href="/workspace">
          进入控制台
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
      <Button size="lg" asChild>
        <Link href="/login">
          <LogInIcon data-icon="inline-start" />
          登录
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/register">
          <UserPlusIcon data-icon="inline-start" />
          注册
        </Link>
      </Button>
      <Button size="lg" variant="ghost" asChild>
        <Link href="/workspace">
          去控制台
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  )
}
