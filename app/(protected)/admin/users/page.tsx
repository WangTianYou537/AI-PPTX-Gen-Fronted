"use client"

import { useAppShell } from "@/components/app-shell"
import { UserManagement } from "@/components/user-management"

export default function AdminUsersPage() {
  const { user } = useAppShell()
  return <UserManagement currentUser={user} />
}
