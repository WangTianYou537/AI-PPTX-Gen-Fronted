import assert from "node:assert/strict"
import test from "node:test"
import { getDefaultPage, pageIdToPath, pathToPageId } from "./navigation.ts"

test("pageIdToPath maps known pages", () => {
  assert.equal(pageIdToPath("workspace.overview"), "/workspace")
  assert.equal(pageIdToPath("admin.users"), "/admin/users")
  assert.equal(pageIdToPath("system.help"), "/help")
})

test("pathToPageId maps known paths and normalizes trailing slash", () => {
  assert.equal(pathToPageId("/workspace"), "workspace.overview")
  assert.equal(pathToPageId("/workspace/"), "workspace.overview")
  assert.equal(pathToPageId("/workspace/topic"), "workspace.topic")
  assert.equal(pathToPageId("/admin/users"), "admin.users")
})

test("pathToPageId falls back to default for unknown path", () => {
  assert.equal(pathToPageId("/unknown"), getDefaultPage())
})
