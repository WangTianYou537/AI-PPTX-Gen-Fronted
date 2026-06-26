"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getMe, getSetupStatus, register } from "@/lib/api"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon, Loader2Icon, UserPlusIcon } from "lucide-react"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState<unknown>(null)
  const [needsSetup, setNeedsSetup] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function checkAuthState() {
      try {
        const setup = await getSetupStatus()
        if (!active) return
        setNeedsSetup(setup.needsSetup)
        if (setup.needsSetup) return
        try { await getMe(); if (active) router.replace("/") } catch {}
      } catch (err) { if (active) setError(err) } finally { if (active) setIsChecking(false) }
    }
    void checkAuthState()
    return () => { active = false }
  }, [router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) { setError(new Error("密码至少需要 8 位")); return }
    if (password !== confirmPassword) { setError(new Error("两次输入的密码不一致")); return }
    setIsSubmitting(true)
    try {
      await register(email, password, username)
      toast.success("注册成功")
      router.push("/")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "注册失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>创建账号</CardTitle>
        <CardDescription>注册普通用户账号，开始使用 AI PPT 工作台。</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error ? <DebugErrorAlert title="注册失败" error={error} /> : null}
            {needsSetup ? <Alert><AlertCircleIcon /><AlertTitle>需要初始化管理员</AlertTitle><AlertDescription>公开注册会在管理员初始化完成后开放。</AlertDescription></Alert> : null}
            <Field>
              <FieldLabel htmlFor="signup-email">邮箱</FieldLabel>
              <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isChecking || needsSetup} required />
              <FieldDescription>注册成功后将自动登录为普通用户。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-username">用户名</FieldLabel>
              <Input id="signup-username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={isChecking || needsSetup} placeholder="用于侧边栏和后台显示" />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">密码</FieldLabel>
              <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isChecking || needsSetup} required minLength={8} />
              <FieldDescription>密码至少需要 8 位。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm-password">确认密码</FieldLabel>
              <Input id="signup-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isChecking || needsSetup} required minLength={8} />
            </Field>
            <Field>
              {needsSetup ? <Button asChild><Link href="/">返回安装引导</Link></Button> : (
                <Button type="submit" disabled={isChecking || isSubmitting || !email || !password || !confirmPassword}>
                  {isSubmitting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <UserPlusIcon data-icon="inline-start" />}
                  注册
                </Button>
              )}
              <FieldDescription className="px-6 text-center">已经有账号？ <Link href="/login">去登录</Link></FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
