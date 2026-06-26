"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getMe, getSetupStatus, login } from "@/lib/api"
import { cn } from "@/lib/utils"
import { DebugErrorAlert } from "@/components/debug-error-alert"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon, Loader2Icon, LogInIcon } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<unknown>(null)
  const [needsSetup, setNeedsSetup] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    let active = true

    async function checkAuthState() {
      try {
        const setup = await getSetupStatus()
        if (!active) {
          return
        }
        setNeedsSetup(setup.needsSetup)
        if (setup.needsSetup) {
          return
        }
        try {
          await getMe()
          if (active) {
            router.replace("/")
          }
        } catch {
          // Stay on the login page.
        }
      } catch (err) {
        if (active) {
          setError(err)
        }
      } finally {
        if (active) {
          setIsChecking(false)
        }
      }
    }

    void checkAuthState()
    return () => {
      active = false
    }
  }, [router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success("登录成功")
      router.push("/")
    } catch (err) {
      setError(err)
      toast.error(err instanceof Error ? err.message : "登录失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>登录账号</CardTitle>
          <CardDescription>登录后即可使用 AI PPT 工作台。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error ? <DebugErrorAlert title="登录失败" error={error} /> : null}

              {needsSetup ? (
                <Alert>
                  <AlertCircleIcon />
                  <AlertTitle>需要初始化管理员</AlertTitle>
                  <AlertDescription>
                    当前系统还没有管理员账号，请先回到首页完成安装引导。
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <FieldLabel htmlFor="login-email">邮箱</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isChecking || needsSetup}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">密码</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isChecking || needsSetup}
                  required
                />
              </Field>
              <Field>
                {needsSetup ? (
                  <Button asChild>
                    <Link href="/">返回安装引导</Link>
                  </Button>
                ) : (
                  <Button type="submit" disabled={isChecking || isSubmitting || !email || !password}>
                    {isSubmitting ? (
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <LogInIcon data-icon="inline-start" />
                    )}
                    登录
                  </Button>
                )}
                <FieldDescription className="text-center">
                  还没有账号？ <Link href="/register">立即注册</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
