"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

export default function SignupRedirectPage() {
  const router = useRouter()
  React.useEffect(() => {
    router.replace("/register")
  }, [router])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="animate-spin" />
        正在前往注册页...
      </div>
    </main>
  )
}
