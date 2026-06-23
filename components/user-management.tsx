"use client"

import * as React from "react"
import { toast } from "sonner"
import { createUser, deleteUser, listUsers, updateUser } from "@/lib/api"
import type { User, UserRole } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircleIcon, Loader2Icon, PlusIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react"

type UserManagementProps = {
  currentUser: User
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = React.useState<User[]>([])
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("user")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function loadUsers() {
    setIsLoading(true)
    setError("")
    try {
      const response = await listUsers()
      setUsers(response.users)
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载用户失败"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load admin user list once after mount
    void loadUsers()
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await createUser({ email, password, role })
      toast.success("用户已创建")
      setEmail("")
      setPassword("")
      setRole("user")
      await loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建用户失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRoleChange(user: User, nextRole: UserRole) {
    try {
      await updateUser(user.id, { role: nextRole })
      toast.success("角色已更新")
      await loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    }
  }

  async function handleToggleDisabled(user: User) {
    try {
      await updateUser(user.id, { disabled: !user.disabled })
      toast.success(user.disabled ? "用户已启用" : "用户已禁用")
      await loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`确认删除用户 ${user.email}？`)) {
      return
    }
    try {
      await deleteUser(user.id)
      toast.success("用户已删除")
      await loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>新增用户</CardTitle>
          <CardDescription>创建普通用户或管理员。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-user-email">邮箱</FieldLabel>
                <Input id="new-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-user-password">密码</FieldLabel>
                <Input id="new-user-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
              </Field>
              <Field>
                <FieldLabel>角色</FieldLabel>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Button type="submit" disabled={isSubmitting || !email || !password}>
                {isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}
                新增用户
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>管理角色、启用状态和删除账号。</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
              {isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{user.email}</p>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    {user.disabled ? <Badge variant="destructive">已禁用</Badge> : <Badge variant="outline">启用</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">创建于 {new Date(user.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={user.role} onValueChange={(value) => handleRoleChange(user, value as UserRole)} disabled={user.id === currentUser.id}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="user">普通用户</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleToggleDisabled(user)} disabled={user.id === currentUser.id}>
                    {user.disabled ? "启用" : "禁用"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(user)} disabled={user.id === currentUser.id}>
                    <Trash2Icon data-icon="inline-start" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
