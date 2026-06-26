"use client"

import * as React from "react"
import { toast } from "sonner"
import { getAdminSettings, listUserGroups, saveAdminSettings } from "@/lib/api"
import type { SystemSettings, UserGroup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, SaveIcon } from "lucide-react"

export function SystemSettingsPanel() {
  const [settings, setSettings] = React.useState<SystemSettings | null>(null)
  const [groups, setGroups] = React.useState<UserGroup[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  async function load() { setIsLoading(true); try { const [nextSettings, groupResponse] = await Promise.all([getAdminSettings(), listUserGroups()]); setSettings(nextSettings); setGroups(groupResponse.groups) } catch (err) { toast.error(err instanceof Error ? err.message : "加载设置失败") } finally { setIsLoading(false) } }
  React.useEffect(() => {
    void Promise.resolve().then(load)
  }, [])
  async function save() { if (!settings) return; setIsSaving(true); try { const saved = await saveAdminSettings({ registrationEnabled: settings.registrationEnabled, defaultUserGroupId: settings.defaultUserGroupId }); setSettings(saved); toast.success("系统设置已保存") } catch (err) { toast.error(err instanceof Error ? err.message : "保存失败") } finally { setIsSaving(false) } }
  return <Card><CardHeader><CardTitle>系统设置</CardTitle><CardDescription>控制公开注册和新用户默认分组。</CardDescription></CardHeader><CardContent>{isLoading || !settings ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2Icon className="animate-spin" />正在加载...</div> : <FieldGroup><div className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><FieldLabel htmlFor="registration-enabled">开放公开注册</FieldLabel><FieldDescription>关闭后仅管理员可在后台创建用户。</FieldDescription></div><Input id="registration-enabled" type="checkbox" className="size-4" checked={settings.registrationEnabled} onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })} /></div><Field><FieldLabel>默认用户组</FieldLabel><Select value={settings.defaultUserGroupId} onValueChange={(value) => setSettings({ ...settings, defaultUserGroupId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{groups.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>公开注册的新用户会自动加入该用户组。</FieldDescription></Field><Button onClick={save} disabled={isSaving}>{isSaving ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}保存设置</Button></FieldGroup>}</CardContent></Card>
}
