"use client"

import type { User } from "@/lib/types"
import { PromptSettingsPanel } from "@/components/prompt-settings"
import { UserManagement } from "@/components/user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsIcon, UsersIcon } from "lucide-react"

type AdminPanelProps = {
  currentUser: User
}

export function AdminPanel({ currentUser }: AdminPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>后台管理</CardTitle>
        <CardDescription>管理用户账号，并为 PPT 架构师和 SVG 生成器分别配置模型和提示词。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">
              <UsersIcon data-icon="inline-start" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <SettingsIcon data-icon="inline-start" />
              角色模型
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement currentUser={currentUser} />
          </TabsContent>
          <TabsContent value="prompts">
            <PromptSettingsPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
