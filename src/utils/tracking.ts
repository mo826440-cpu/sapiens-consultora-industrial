import { TASK_STATUSES, type TaskStatus } from '@/config/constants.ts'

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === '') {
    return null
  }

  return value
}

export function parseTags(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatTags(tags: string[] | null | undefined): string {
  return tags?.join(', ') ?? ''
}

export function isTaskOverdue(
  status: TaskStatus,
  dueDate: string | null,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  return status !== TASK_STATUSES.finalizada && Boolean(dueDate) && (dueDate ?? '') < today
}

export function wouldCreateCycle(
  taskId: string,
  dependsOnIds: string[],
  existing: { task_id: string; depends_on_task_id: string }[],
): boolean {
  const outgoing = new Map<string, string[]>()

  for (const edge of existing) {
    if (edge.task_id === taskId) {
      continue
    }

    const list = outgoing.get(edge.task_id) ?? []
    list.push(edge.depends_on_task_id)
    outgoing.set(edge.task_id, list)
  }

  outgoing.set(taskId, dependsOnIds)

  const visiting = new Set<string>()
  const visited = new Set<string>()

  const visit = (node: string): boolean => {
    if (visiting.has(node)) {
      return true
    }

    if (visited.has(node)) {
      return false
    }

    visiting.add(node)
    for (const next of outgoing.get(node) ?? []) {
      if (visit(next)) {
        return true
      }
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }

  return visit(taskId)
}
