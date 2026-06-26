"use client"

import * as React from "react"
import { toast } from "sonner"
import { createUserGroup, deleteUserGroup, listUserGroups, updateUserGroup } from "@/lib/api"
import type { UserGroup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2Icon, PlusIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react"

export function UserGroupManagement() {
  const [groups, setGroups] = React.useState<UserGroup[]>([])
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [slideLimit, setSlideLimit] = React.useState("100")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  async function loadGroups() { setIsLoading(true); try { setGroups((await listUserGroups()).groups) } catch (err) { toast.error(err instanceof Error ? err.message : "加载用户组失败") } finally { setIsLoading(false) } }
  React.useEffect(() => {
    void Promise.resolve().then(loadGroups)
  }, [])
  async function handleCreate(event: React.FormEvent) { event.preventDefault(); setIsSubmitting(true); try { await createUserGroup({ name, description, dailyPPTLimit: 0, dailySlideLimit: Number(slideLimit) }); toast.success("用户组已创建"); setName(""); setDescription(""); setSlideLimit("100"); await loadGroups() } catch (err) { toast.error(err instanceof Error ? err.message : "创建用户组失败") } finally { setIsSubmitting(false) } }
  async function patch(group: UserGroup, payload: Parameters<typeof updateUserGroup>[1], message: string) { try { await updateUserGroup(group.id, payload); toast.success(message); await loadGroups() } catch (err) { toast.error(err instanceof Error ? err.message : "更新失败") } }
  async function remove(group: UserGroup) { if (!window.confirm(`确认删除用户组 ${group.name}？`)) return; try { await deleteUserGroup(group.id); toast.success("用户组已删除"); await loadGroups() } catch (err) { toast.error(err instanceof Error ? err.message : "删除失败") } }
  return <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]"><Card><CardHeader><CardTitle>新增用户组</CardTitle><CardDescription>为不同用户配置每日 PPT 和页数额度。</CardDescription></CardHeader><CardContent><form onSubmit={handleCreate}><FieldGroup><Field><FieldLabel>名称</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field><Field><FieldLabel>描述</FieldLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field><div className="grid grid-cols-1 gap-3"><Field><FieldLabel>页数/天</FieldLabel><Input type="number" min={0} value={slideLimit} onChange={(e) => setSlideLimit(e.target.value)} /></Field></div><Button disabled={isSubmitting || !name}>{isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}新增用户组</Button></FieldGroup></form></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>用户组列表</CardTitle><CardDescription>默认组不可删除；有用户归属的组删除会被拒绝。</CardDescription></div><Button size="sm" variant="outline" onClick={loadGroups} disabled={isLoading}>{isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}刷新</Button></div></CardHeader><CardContent><div className="flex flex-col gap-3">{groups.map((group) => <div key={group.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{group.name}</p>{group.isDefault ? <Badge>默认</Badge> : null}</div><p className="text-sm text-muted-foreground">{group.description || "无描述"}</p><p className="mt-1 text-sm text-muted-foreground">{group.dailySlideLimit} 页 / 天</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => patch(group, { isDefault: true }, "默认用户组已更新")} disabled={group.isDefault}>设为默认</Button><Button size="sm" variant="destructive" onClick={() => remove(group)} disabled={group.isDefault}><Trash2Icon data-icon="inline-start" />删除</Button></div></div></div>)}</div></CardContent></Card></div>
}
