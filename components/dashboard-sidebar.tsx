"use client"

import * as React from "react"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { FileTextIcon, LayoutDashboardIcon, LogOutIcon, SettingsIcon, WandSparklesIcon } from "lucide-react"

type DashboardSection = "workspace" | "admin"

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
  onLogout: () => void
}

function userInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "U"
}

export function DashboardSidebar({
  user,
  activeSection,
  onSectionChange,
  onLogout,
  ...props
}: DashboardSidebarProps) {
  const items = [
    {
      title: "PPT 工作台",
      description: "生成架构、SVG 与 PPTX",
      section: "workspace" as const,
      icon: WandSparklesIcon,
      visible: true,
    },
    {
      title: "后台管理",
      description: "用户与生成角色模型",
      section: "admin" as const,
      icon: SettingsIcon,
      visible: user.role === "admin",
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="AI PPT Generator">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboardIcon />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">AI PPT Generator</span>
                <span className="truncate text-xs text-muted-foreground">智能演示文稿工作台</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>功能导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton
                      isActive={activeSection === item.section}
                      tooltip={item.title}
                      onClick={() => onSectionChange(item.section)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>工作流</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-2 px-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileTextIcon />
                <span>主题输入 → 架构审核 → SVG 预览 → PPTX 导出</span>
              </div>
              <Badge variant="secondary" className="w-fit">
                后台角色模型驱动
              </Badge>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user.email}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent font-medium text-sidebar-accent-foreground">
                {userInitial(user.email)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.email}</span>
                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="退出登录" onClick={onLogout}>
              <LogOutIcon />
              <span>退出登录</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
