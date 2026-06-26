import type { LucideIcon } from "lucide-react"
import { CircleHelpIcon, FileImageIcon, FileTextIcon, LayoutDashboardIcon, SettingsIcon, ServerIcon, UsersIcon, UserCogIcon, WandSparklesIcon } from "lucide-react"
import type { UserRole } from "@/lib/types"

export type AppPageId = "workspace.overview" | "workspace.topic" | "workspace.outline" | "workspace.ppt" | "admin.users" | "admin.groups" | "admin.settings" | "admin.roles" | "admin.storage" | "system.help"
export type RoleVisibility = "all" | "admin"
export type AppMenuItem = { id: AppPageId; title: string; description: string; role: RoleVisibility; icon: LucideIcon }
export type AppMenuGroup = { id: string; title: string; description: string; role: RoleVisibility; icon: LucideIcon; items: AppMenuItem[] }
export type AppPageMeta = AppMenuItem & { groupId: string; groupTitle: string; groupDescription: string }

export const APP_MENU: AppMenuGroup[] = [
  { id: "workspace", title: "PPT 生成", description: "从主题到 PPTX 的完整生成流程", role: "all", icon: WandSparklesIcon, items: [
    { id: "workspace.overview", title: "工作台总览", description: "统一管理主题输入、架构审核、PPT 预览和 PPTX 导出。", role: "all", icon: LayoutDashboardIcon },
    { id: "workspace.topic", title: "主题输入", description: "输入主题、受众、页数和视觉风格，启动 PPT 架构生成。", role: "all", icon: FileTextIcon },
    { id: "workspace.outline", title: "架构审核", description: "审核和修改 PPT 架构 JSON，再进入页面生成。", role: "all", icon: FileTextIcon },
    { id: "workspace.ppt", title: "PPT 预览与导出", description: "预览每页 PPT，复制源码或导出 PPTX 文件。", role: "all", icon: FileImageIcon },
  ] },
  { id: "admin", title: "后台管理", description: "管理用户账号、用户组和系统配置", role: "admin", icon: SettingsIcon, items: [
    { id: "admin.users", title: "用户管理", description: "创建用户、分配用户组、设置单用户额度。", role: "admin", icon: UsersIcon },
    { id: "admin.groups", title: "用户组", description: "创建用户组并配置每日生成额度。", role: "admin", icon: UserCogIcon },
    { id: "admin.settings", title: "系统设置", description: "控制公开注册和默认用户组。", role: "admin", icon: SettingsIcon },
    { id: "admin.roles", title: "角色模型", description: "配置 PPT 架构师和 PPT-SVG 生成器的模型、API Key、工具调用和系统提示词。", role: "admin", icon: SettingsIcon },
    { id: "admin.storage", title: "存储管理", description: "查看、测试和切换系统主数据存储方式。", role: "admin", icon: ServerIcon },
  ] },
  { id: "system", title: "系统", description: "系统说明和使用指引", role: "all", icon: CircleHelpIcon, items: [
    { id: "system.help", title: "帮助与说明", description: "查看使用流程、权限说明和后台配置提示。", role: "all", icon: CircleHelpIcon },
  ] },
]

export function canAccessRole(visibility: RoleVisibility, role: UserRole) { return visibility === "all" || role === "admin" }
export function filterMenuByRole(role: UserRole) { return APP_MENU.filter((group) => canAccessRole(group.role, role)).map((group) => ({ ...group, items: group.items.filter((item) => canAccessRole(item.role, role)) })).filter((group) => group.items.length > 0) }
export function getDefaultPage(): AppPageId { return "workspace.overview" }
export function findPage(pageId: AppPageId): AppPageMeta { for (const group of APP_MENU) { const item = group.items.find((entry) => entry.id === pageId); if (item) return { ...item, groupId: group.id, groupTitle: group.title, groupDescription: group.description } } return findPage(getDefaultPage()) }
export function isPageVisible(pageId: AppPageId, role: UserRole) { return canAccessRole(findPage(pageId).role, role) }
