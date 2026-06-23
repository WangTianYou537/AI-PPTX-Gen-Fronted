"use client"

import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type DashboardHeaderProps = {
  title: string
  description: string
  user: User
}

export function DashboardHeader({ title, description, user }: DashboardHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-medium">{title}</h1>
            <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="hidden md:inline-flex">
          {user.email}
        </Badge>
      </div>
    </header>
  )
}
