"use client"

import * as React from "react"
import { toast } from "sonner"
import { createUser, deleteUser, listUserGroups, listUsers, updateUser } from "@/lib/api"
import type { User, UserGroup, UserRole } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircleIcon, Loader2Icon, PlusIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react"

type UserManagementProps = { currentUser: User }
const inherit = "__inherit__"
const concurrencyOptions = [1, 2, 3, 4, 5, 8, 10]

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = React.useState<User[]>([])
  const [groups, setGroups] = React.useState<UserGroup[]>([])
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("user")
  const [groupId, setGroupId] = React.useState("")
  const [slideLimit, setSlideLimit] = React.useState("")
  const [concurrencyLimit, setConcurrencyLimit] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function loadAll() {
    setIsLoading(true); setError("")
    try {
      const [userResponse, groupResponse] = await Promise.all([listUsers(), listUserGroups()])
      setUsers(userResponse.users); setGroups(groupResponse.groups)
      if (!groupId) setGroupId(groupResponse.groups.find((g) => g.isDefault)?.id || groupResponse.groups[0]?.id || "")
    } catch (err) { const message = err instanceof Error ? err.message : "加载用户失败"; setError(message); toast.error(message) } finally { setIsLoading(false) }
  }
  React.useEffect(() => {
    void Promise.resolve().then(loadAll)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load admin user data once after mount
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault(); setIsSubmitting(true)
    try {
      await createUser({ email, username, password, role, groupId, dailySlideLimit: slideLimit === "" ? undefined : Number(slideLimit), slideConcurrencyLimit: concurrencyLimit === "" ? undefined : Number(concurrencyLimit) })
      toast.success("用户已创建")
      setEmail(""); setUsername(""); setPassword(""); setRole("user"); setSlideLimit(""); setConcurrencyLimit("")
      await loadAll()
    } catch (err) { toast.error(err instanceof Error ? err.message : "创建用户失败") } finally { setIsSubmitting(false) }
  }
  async function patch(user: User, payload: Parameters<typeof updateUser>[1], message: string) { try { await updateUser(user.id, payload); toast.success(message); await loadAll() } catch (err) { toast.error(err instanceof Error ? err.message : "更新失败") } }
  async function handleDelete(user: User) { if (!window.confirm(`确认删除用户 ${user.email}？`)) return; try { await deleteUser(user.id); toast.success("用户已删除"); await loadAll() } catch (err) { toast.error(err instanceof Error ? err.message : "删除失败") } }
  const groupName = (id: string) => groups.find((group) => group.id === id)?.name || "未分组"

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card><CardHeader><CardTitle>新增用户</CardTitle><CardDescription>创建普通用户或管理员，可指定用户组、单独额度和页面生成并发数。</CardDescription></CardHeader><CardContent>
        <form onSubmit={handleCreate}><FieldGroup>
          <Field><FieldLabel htmlFor="new-user-email">邮箱</FieldLabel><Input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field><FieldLabel htmlFor="new-user-username">用户名</FieldLabel><Input id="new-user-username" value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
          <Field><FieldLabel htmlFor="new-user-password">密码</FieldLabel><Input id="new-user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field>
          <Field><FieldLabel>角色</FieldLabel><Select value={role} onValueChange={(value) => setRole(value as UserRole)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="user">普通用户</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectGroup></SelectContent></Select></Field>
          <Field><FieldLabel>用户组</FieldLabel><Select value={groupId} onValueChange={setGroupId}><SelectTrigger className="w-full"><SelectValue placeholder="选择用户组" /></SelectTrigger><SelectContent><SelectGroup>{groups.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
          <Field><FieldLabel>页数/天</FieldLabel><Input type="number" min={0} value={slideLimit} onChange={(e) => setSlideLimit(e.target.value)} placeholder="继承" /></Field>
          <Field><FieldLabel>页面生成并发数</FieldLabel><Input type="number" min={1} max={10} value={concurrencyLimit} onChange={(e) => setConcurrencyLimit(e.target.value)} placeholder="继承用户组" /><FieldDescription>留空表示继承用户组配置。</FieldDescription></Field>
          <Button type="submit" disabled={isSubmitting || !email || !password || !groupId}>{isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}新增用户</Button>
        </FieldGroup></form>
      </CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>用户列表</CardTitle><CardDescription>管理角色、分组、启用状态、每日生成额度和页面并发数。</CardDescription></div><Button variant="outline" size="sm" onClick={loadAll} disabled={isLoading}>{isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}刷新</Button></div></CardHeader><CardContent>
        <div className="flex flex-col gap-3">
          {error ? <Alert variant="destructive"><AlertCircleIcon /><AlertTitle>加载失败</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{user.username || user.email}</p><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>{user.disabled ? <Badge variant="destructive">已禁用</Badge> : <Badge variant="outline">启用</Badge>}</div><p className="text-sm text-muted-foreground">{user.email} · {groupName(user.groupId)} · 创建于 {new Date(user.createdAt).toLocaleString()}</p></div><Button variant="destructive" size="sm" onClick={() => handleDelete(user)} disabled={user.id === currentUser.id}><Trash2Icon data-icon="inline-start" />删除</Button></div>
              <div className="grid gap-2 md:grid-cols-4">
                <Select value={user.role} onValueChange={(value) => patch(user, { role: value as UserRole }, "角色已更新")} disabled={user.id === currentUser.id}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="user">普通用户</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectGroup></SelectContent></Select>
                <Select value={user.groupId} onValueChange={(value) => patch(user, { groupId: value }, "用户组已更新")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{groups.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}</SelectGroup></SelectContent></Select>
                <Select value={user.dailySlideLimit == null ? inherit : String(user.dailySlideLimit)} onValueChange={(value) => patch(user, { dailySlideLimit: value === inherit ? null : Number(value) }, "页数额度已更新")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value={inherit}>页数继承组</SelectItem>{[0,10,30,50,100,200,500].map((n) => <SelectItem key={n} value={String(n)}>{n} 页/天</SelectItem>)}</SelectGroup></SelectContent></Select>
                <Select value={user.slideConcurrencyLimit == null ? inherit : String(user.slideConcurrencyLimit)} onValueChange={(value) => patch(user, { slideConcurrencyLimit: value === inherit ? null : Number(value) }, "并发数已更新")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value={inherit}>并发继承组</SelectItem>{concurrencyOptions.map((n) => <SelectItem key={n} value={String(n)}>并发 {n}</SelectItem>)}</SelectGroup></SelectContent></Select>
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => patch(user, { disabled: !user.disabled }, user.disabled ? "用户已启用" : "用户已禁用")} disabled={user.id === currentUser.id}>{user.disabled ? "启用" : "禁用"}</Button><FieldDescription>{user.dailySlideLimit == null ? "页数额度继承用户组" : "已设置单用户页数额度覆盖"}；{user.slideConcurrencyLimit == null ? "并发数继承用户组" : "已设置单用户并发数覆盖"}</FieldDescription></div>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}
