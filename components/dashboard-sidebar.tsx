"use client"

import * as React from "react"
import type { AppPageId } from "@/lib/navigation"
import { filterMenuByRole } from "@/lib/navigation"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LayoutDashboardIcon, LogOutIcon, Sparkles, HelpCircle, ChevronRight } from "lucide-react"

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
  onLogout: () => void
}

// 提取菜单组的 TypeScript 类型
type MenuGroup = ReturnType<typeof filterMenuByRole>[number]

function userInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "U"
}

/**
 * 重构后的单个菜单项组件
 * 自动识别是否有子菜单，并处理对应的折叠/高亮状态
 */
function NavigationMenuItem({
  group,
  activePage,
  onPageChange,
}: {
  group: MenuGroup
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
}) {
  const hasSubItems = group.items && group.items.length > 0
  const isGroupActive = hasSubItems && group.items.some((item) => item.id === activePage)

  // 情况 A: 扁平菜单（无子菜单）
  if (!hasSubItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={activePage === group.id}
          tooltip={group.title}
          onClick={() => onPageChange(group.id as AppPageId)}
        >
          {group.icon && <group.icon className="size-4" />}
          <span>{group.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // 情况 B: 嵌套菜单（带折叠功能）
  return (
    <Collapsible
      asChild
      defaultOpen={isGroupActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isGroupActive} tooltip={group.title}>
            {group.icon && <group.icon className="size-4" />}
            <span>{group.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => (
              <SidebarMenuSubItem key={item.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={activePage === item.id}
                  aria-current={activePage === item.id ? "page" : undefined}
                >
                  <button type="button" onClick={() => onPageChange(item.id)}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function DashboardSidebar({
  user,
  activePage,
  onPageChange,
  onLogout,
  ...props
}: DashboardSidebarProps) {
  const menu = filterMenuByRole(user.role)
  const aiCredits = { used: 32, total: 100 }
  const creditPercentage = Math.min(100, Math.max(0, (aiCredits.used / aiCredits.total) * 100))

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* 头部：品牌 Logo 与核心主动作 */}
      <SidebarHeader className="gap-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="AI PPT Generator">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboardIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">AI PPT Generator</span>
                <span className="truncate text-xs text-muted-foreground">智能演示文稿创作</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="px-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="AI 一键生成"
              className="bg-primary hover:bg-primary/90 text-primary-foreground hover:text-primary-foreground shadow-sm transition-all"
              onClick={() => {
                // 此处可绑定跳转到 AI 生成页的逻辑
              }}
            >
              <Sparkles className="size-4 shrink-0 animate-pulse text-yellow-300" />
              <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">
                AI 一键生成
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 主导航内容 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作台</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((group) => (
                <NavigationMenuItem
                  key={group.id}
                  group={group}
                  activePage={activePage}
                  onPageChange={onPageChange}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* 底部功能区 */}
      <SidebarFooter className="gap-2">
        <SidebarMenu>
          {/* AI 算力额度 */}
          <SidebarMenuItem className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg border bg-sidebar-accent/30 p-3 text-sidebar-accent-foreground">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="size-3 text-primary" />
                  AI 算力额度
                </span>
                <span className="font-semibold">
                  {aiCredits.used} / {aiCredits.total} 点
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-sidebar-border overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-300" 
                  style={{ width: `${creditPercentage}%` }} 
                />
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                每日重置 · 升级解锁无限额度
              </p>
            </div>
          </SidebarMenuItem>

          {/* 帮助与反馈 */}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="帮助与反馈">
              <HelpCircle className="size-4" />
              <span>帮助与反馈</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* 用户信息 */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user.email}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent font-medium text-sidebar-accent-foreground shrink-0">
                {userInitial(user.email)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.email}</span>
                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
              </div>
              <Badge 
                variant={user.role === "admin" ? "default" : "outline"} 
                className="group-data-[collapsible=icon]:hidden scale-90"
              >
                {user.role}
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* 退出登录 */}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="退出登录" onClick={onLogout}>
              <LogOutIcon className="size-4" />
              <span>退出登录</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}