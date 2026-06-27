"use client"

import { useAppShell } from "@/components/app-shell"
import { HelpPage } from "@/components/help-page"

export default function HelpRoutePage() {
  const { user } = useAppShell()
  return <HelpPage isAdmin={user.role === "admin"} />
}
