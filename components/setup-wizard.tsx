"use client"

import * as React from "react"
import { toast } from "sonner"
import { setupAdmin } from "@/lib/api"
import type { User } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon, Loader2Icon, SparklesIcon } from "lucide-react"

type SetupWizardProps = {
  onReady: (user: User) => void
}

export function SetupWizard({ onReady }: SetupWizardProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await setupAdmin(email, password)
      toast.success("管理员已创建")
      onReady(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : "安装失败"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>初始化 AI PPT Generator</CardTitle>
          <CardDescription>首次使用需要创建一个管理员账号，之后可以在后台管理用户和提示词。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>安装失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="setup-email">管理员邮箱</FieldLabel>
                <Input
                  id="setup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="setup-password">密码</FieldLabel>
                <Input
                  id="setup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
                <FieldDescription>至少 8 位。</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="setup-confirm-password">确认密码</FieldLabel>
                <Input
                  id="setup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              <Button type="submit" disabled={isSubmitting || !email || !password}>
                {isSubmitting ? (
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <SparklesIcon data-icon="inline-start" />
                )}
                创建管理员
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
