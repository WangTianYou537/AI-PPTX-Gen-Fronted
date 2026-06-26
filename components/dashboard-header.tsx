"use client"

import type { AppPageMeta } from "@/lib/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"

type DashboardHeaderProps = {
  page: AppPageMeta
}

export function DashboardHeader({ page }: DashboardHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      {/* 
        内层容器：
        1. 显式设置 h-full，继承 Header 的整体高度。
        2. 使用 items-center 进行标准的垂直居中对齐。
        3. min-w-0 flex-1 配合面包屑的截断，确保在窄屏下不会撑开 Header 高度。
      */}
      <div className="flex h-full w-full items-center gap-1 px-4 lg:px-6 lg:gap-2 min-w-0">
        
        {/* 侧边栏触发按钮 */}
        <SidebarTrigger className="-ml-1 shrink-0" />
        
        {/* 
          垂直分割线：
          直接使用原生 div 渲染。固定 h-4（16px）、w-px（1px）、bg-border 颜色。
          这样可以完全规避 Radix UI Separator 在 flex 容器中默认 h-full 导致的拉伸或高度塌陷问题。
        */}
        <div className="mx-2 h-4 w-px bg-border shrink-0" aria-hidden="true" />
        
        {/* 
          面包屑导航：
          1. 加上 min-w-0 防止宽度溢出。
          2. 对面包屑文本增加 truncate（截断），保证在大标题或小屏幕下布局依然优雅整洁，不会换行。
        */}
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="hidden md:block shrink-0">
              {page.groupTitle}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block shrink-0" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
      </div>
    </header>
  )
}