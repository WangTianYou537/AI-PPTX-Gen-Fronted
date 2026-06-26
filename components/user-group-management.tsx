"use client"

import * as React from "react"
import { toast } from "sonner"
import { createUserGroup, deleteUserGroup, listUserGroups, updateUserGroup } from "@/lib/api"
import type { UserGroup } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, PlusIcon, RefreshCcwIcon, SaveIcon, Trash2Icon } from "lucide-react"

type GroupDraft = { name: string; description: string; dailySlideLimit: string; slideConcurrencyLimit: string }

const concurrencyOptions = [1, 2, 3, 4, 5, 8, 10]

export function UserGroupManagement() {
  const [groups, setGroups] = React.useState<UserGroup[]>([])
  const [drafts, setDrafts] = React.useState<Record<string, GroupDraft>>({})
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [slideLimit, setSlideLimit] = React.useState("100")
  const [concurrencyLimit, setConcurrencyLimit] = React.useState("2")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function loadGroups() {
    setIsLoading(true)
    try {
      const nextGroups = (await listUserGroups()).groups
      setGroups(nextGroups)
      setDrafts(Object.fromEntries(nextGroups.map((group) => [group.id, groupDraft(group)])))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载用户组失败")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    void Promise.resolve().then(loadGroups)
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await createUserGroup({ name, description, dailyPPTLimit: 0, dailySlideLimit: Number(slideLimit), slideConcurrencyLimit: Number(concurrencyLimit) })
      toast.success("用户组已创建")
      setName("")
      setDescription("")
      setSlideLimit("100")
      setConcurrencyLimit("2")
      await loadGroups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建用户组失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function patch(group: UserGroup, payload: Parameters<typeof updateUserGroup>[1], message: string) {
    try {
      await updateUserGroup(group.id, payload)
      toast.success(message)
      await loadGroups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    }
  }

  async function saveGroup(group: UserGroup) {
    const draft = drafts[group.id]
    if (!draft) return
    await patch(group, {
      name: draft.name,
      description: draft.description,
      dailySlideLimit: Number(draft.dailySlideLimit),
      slideConcurrencyLimit: Number(draft.slideConcurrencyLimit),
    }, "用户组已更新")
  }

  async function remove(group: UserGroup) {
    if (!window.confirm(`确认删除用户组 ${group.name}？`)) return
    try {
      await deleteUserGroup(group.id)
      toast.success("用户组已删除")
      await loadGroups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  function setDraft(groupID: string, patch: Partial<GroupDraft>) {
    setDrafts((current) => ({ ...current, [groupID]: { ...current[groupID], ...patch } }))
  }

  return <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]"><Card><CardHeader><CardTitle>新增用户组</CardTitle><CardDescription>为不同用户配置每日 PPT 页数额度和页面生成并发数。</CardDescription></CardHeader><CardContent><form onSubmit={handleCreate}><FieldGroup><Field><FieldLabel>名称</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field><Field><FieldLabel>描述</FieldLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field><Field><FieldLabel>页数/天</FieldLabel><Input type="number" min={0} value={slideLimit} onChange={(e) => setSlideLimit(e.target.value)} /></Field><Field><FieldLabel>页面生成并发数</FieldLabel><Input type="number" min={1} max={10} value={concurrencyLimit} onChange={(e) => setConcurrencyLimit(e.target.value)} /><FieldDescription>建议保持较小数值，过高可能触发模型服务限流。</FieldDescription></Field><Button disabled={isSubmitting || !name}>{isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}新增用户组</Button></FieldGroup></form></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>用户组列表</CardTitle><CardDescription>可编辑名称、描述、每日默认页数额度和页面生成并发数。</CardDescription></div><Button size="sm" variant="outline" onClick={loadGroups} disabled={isLoading}>{isLoading ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <RefreshCcwIcon data-icon="inline-start" />}刷新</Button></div></CardHeader><CardContent><div className="flex flex-col gap-3">{groups.map((group) => { const draft = drafts[group.id] ?? groupDraft(group); return <div key={group.id} className="rounded-lg border p-3"><div className="flex flex-col gap-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{group.name}</p>{group.isDefault ? <Badge>默认</Badge> : null}</div><p className="text-sm text-muted-foreground">{group.dailySlideLimit} 页 / 天 · 并发 {group.slideConcurrencyLimit}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => patch(group, { isDefault: true }, "默认用户组已更新")} disabled={group.isDefault}>设为默认</Button><Button size="sm" variant="destructive" onClick={() => remove(group)} disabled={group.isDefault}><Trash2Icon data-icon="inline-start" />删除</Button></div></div><FieldGroup><div className="grid gap-3 md:grid-cols-2"><Field><FieldLabel>用户组名称</FieldLabel><Input value={draft.name} onChange={(e) => setDraft(group.id, { name: e.target.value })} /></Field><Field><FieldLabel>每日默认页数额度</FieldLabel><Input type="number" min={0} value={draft.dailySlideLimit} onChange={(e) => setDraft(group.id, { dailySlideLimit: e.target.value })} /></Field></div><Field><FieldLabel>描述</FieldLabel><Textarea value={draft.description} onChange={(e) => setDraft(group.id, { description: e.target.value })} /></Field><div className="flex flex-wrap items-end gap-2"><Field className="min-w-40"><FieldLabel>页面生成并发数</FieldLabel><Select value={draft.slideConcurrencyLimit} onValueChange={(value) => setDraft(group.id, { slideConcurrencyLimit: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{concurrencyOptions.map((n) => <SelectItem key={n} value={String(n)}>并发 {n}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Button size="sm" onClick={() => saveGroup(group)} disabled={!draft.name}><SaveIcon data-icon="inline-start" />保存修改</Button></div></FieldGroup></div></div> })}</div></CardContent></Card></div>
}

function groupDraft(group: UserGroup): GroupDraft {
  return { name: group.name, description: group.description, dailySlideLimit: String(group.dailySlideLimit), slideConcurrencyLimit: String(group.slideConcurrencyLimit) }
}
