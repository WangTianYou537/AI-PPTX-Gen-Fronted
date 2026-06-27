"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/workspace")
  }, [router])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="animate-spin" />
        正在进入工作台...
      </div>
    </main>
  )
}
