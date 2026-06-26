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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  LayoutDashboardIcon, 
  LogOutIcon, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  ChevronsUpDown 
} from "lucide-react"

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
  onLogout: () => void
}

type MenuGroup = ReturnType<typeof filterMenuByRole>[number]

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  user: "普通成员",
  member: "普通成员",
}

function userInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "U"
}

function NavigationMenuItem({
  group,
  activePage,
  onPageChange,
}: {
  group: MenuGroup
  activePage: AppPageId
  onPageChange: (page: AppPageId) => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const hasSubItems = group.items && group.items.length > 0
  const isGroupActive = hasSubItems && group.items.some((item) => item.id === activePage)

  // 情况 A: 折叠状态且有子菜单 -> 右侧悬浮弹出菜单 (字号统一为舒适的 text-sm / text-xs)
  if (isCollapsed && hasSubItems) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive={isGroupActive}
              tooltip={group.title}
              className="hover:bg-sidebar-accent/60 data-[active=true]:bg-indigo-50/50 dark:data-[active=true]:bg-indigo-950/30 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-indigo-400 transition-colors"
            >
              {group.icon && <group.icon className="size-4 shrink-0" />}
              <span className="sr-only">{group.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-52 rounded-xl border-border/50 bg-card/95 backdrop-blur-md">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">
              {group.title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {group.items.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <button
                  type="button"
                  onClick={() => onPageChange(item.id as AppPageId)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                    activePage === item.id
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  {item.icon && <item.icon className="size-4 shrink-0" />}
                  <span>{item.title}</span>
                </button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  // 情况 B: 扁平单菜单 (字号采用标准 text-sm)
  if (!hasSubItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={activePage === group.id}
          tooltip={group.title}
          onClick={() => onPageChange(group.id as AppPageId)}
          className="h-10 hover:bg-sidebar-accent/60 data-[active=true]:bg-indigo-50/50 dark:data-[active=true]:bg-indigo-950/30 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-indigo-400 transition-colors text-sm"
        >
          {group.icon && (
            <group.icon className="size-4 text-muted-foreground group-data-[active=true]:text-indigo-600 dark:group-data-[active=true]:text-indigo-400 transition-colors" />
          )}
          <span className="font-medium">{group.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // 情况 C: 正常展开的嵌套折叠菜单 (子菜单字号提升至 text-sm，去掉了蚂蚁字)
  return (
    <Collapsible
      asChild
      defaultOpen={isGroupActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            isActive={isGroupActive} 
            tooltip={group.title}
            className="h-10 hover:bg-sidebar-accent/60 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-indigo-400 transition-colors text-sm"
          >
            {group.icon && (
              <group.icon className="size-4 text-muted-foreground group-data-[active=true]:text-indigo-600 dark:group-data-[active=true]:text-indigo-400" />
            )}
            <span className="font-medium">{group.title}</span>
            <ChevronRight className="ml-auto size-4 opacity-60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-4 border-l border-sidebar-border/60 pl-3 my-1 space-y-1">
            {group.items.map((item) => (
              <SidebarMenuSubItem key={item.id}>
                <SidebarMenuSubButton
                  isActive={activePage === item.id}
                  aria-current={activePage === item.id ? "page" : undefined}
                  onClick={() => onPageChange(item.id)}
                  className="w-full h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 data-[active=true]:text-indigo-600 dark:data-[active=true]:text-indigo-400 data-[active=true]:bg-indigo-50/30 dark:data-[active=true]:bg-indigo-950/20 transition-colors cursor-pointer"
                >
                  {item.icon && <item.icon className="size-4 shrink-0" />}
                  <span>{item.title}</span>
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
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border/50">
      
      {/* 头部：品牌 Logo */}
      <SidebarHeader className="gap-5 px-3 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="AI PPT Generator" className="hover:bg-transparent">
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm">
                <LayoutDashboardIcon className="size-5" />
              </div>
              <div className="grid flex-1 text-left ml-2.5">
                <span className="truncate font-bold text-foreground text-sm tracking-wide">AI PPT Generator</span>
                <span className="truncate text-xs text-muted-foreground/80 mt-0.5">智能演示文稿创作</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 主导航 */}
      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="gap-1">
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

      <SidebarSeparator className="opacity-50" />

      {/* 底部 */}
      <SidebarFooter className="gap-2 p-3">
        <SidebarMenu className="gap-1.5">
          
          {/* AI 算力额度：字号由 text-[10px] 提升至 text-xs */}
          <SidebarMenuItem className="px-1 py-1 group-data-[collapsible=icon]:hidden">
            <div className="rounded-xl border border-sidebar-border/50 bg-sidebar-accent/20 p-4 text-sidebar-accent-foreground backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="size-3.5 text-indigo-500" />
                  AI 算力额度
                </span>
                <span className="font-bold text-foreground">
                  {aiCredits.used} / {aiCredits.total} 点
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-sidebar-border/50 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300" 
                  style={{ width: `${creditPercentage}%` }} 
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70 leading-normal">
                每日重置 · 升级解锁无限额度
              </p>
            </div>
          </SidebarMenuItem>

          {/* 帮助与反馈：字号升级为 text-sm */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="帮助与反馈" 
              className="h-10 hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <HelpCircle className="size-4 opacity-80 shrink-0" />
              <span className="font-medium">帮助与反馈</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="my-1 opacity-50" />

          {/* 用户菜单与角色标识：统一为下拉菜单，字号升级为 text-sm / text-xs */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  tooltip={user.email} 
                  className="w-full justify-between hover:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                      {userInitial(user.email)}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold text-foreground">{user.email}</span>
                      <span className="truncate text-xs text-muted-foreground/85 mt-0.5">
                        {ROLE_LABELS[user.role] || "成员"}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/60 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="end" 
                sideOffset={4}
                className="w-56 rounded-xl border-border/50 bg-card/95 backdrop-blur-md shadow-sm"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-left text-sm">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                      {userInitial(user.email)}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold text-foreground">{user.email}</span>
                      <span className="truncate text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[user.role] || "成员"}</span>
                    </div>
                    <Badge 
                      variant={user.role === "admin" ? "default" : "outline"} 
                      className="capitalize scale-90 shrink-0"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-sm py-2 px-3"
                >
                  <LogOutIcon className="mr-2.5 size-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}