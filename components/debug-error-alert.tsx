"use client"

import * as React from "react"
import { toast } from "sonner"
import { APIRequestError } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, ClipboardIcon } from "lucide-react"

type DebugErrorAlertProps = {
  title?: string
  error: unknown
}

function debugText(error: unknown) {
  if (error instanceof APIRequestError) {
    return JSON.stringify({
      message: error.message,
      status: error.status,
      method: error.method,
      path: error.path,
      requestId: error.requestId,
      detail: error.detail,
      raw: error.raw,
    }, null, 2)
  }
  if (error instanceof Error) {
    return error.stack || error.message
  }
  return String(error)
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function DebugErrorAlert({ title = "请求失败", error }: DebugErrorAlertProps) {
  const isAPIError = error instanceof APIRequestError
  const text = debugText(error)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    toast.success("调试信息已复制")
  }

  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{errorMessage(error, title)}</span>
        {isAPIError ? (
          <span className="text-xs opacity-90">
            Request ID: {error.requestId || "无"} · {error.method} {error.path} · HTTP {error.status}
          </span>
        ) : null}
        <details className="rounded-md border border-destructive/30 p-2">
          <summary className="cursor-pointer text-xs font-medium">查看调试详情</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{text}</pre>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleCopy}>
            <ClipboardIcon data-icon="inline-start" />
            复制调试信息
          </Button>
        </details>
      </AlertDescription>
    </Alert>
  )
}
