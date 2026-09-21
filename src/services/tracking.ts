import { getSupabase } from '@/lib/supabase.ts'
import type { TaskFormValues } from '@/schemas/tracking.ts'
import type {
  MilestoneRow,
  ProgressUpdateRow,
  StageItemRow,
  StageRow,
  TaskCommentRow,
  TaskRow,
} from '@/types/database.types.ts'
import { emptyToNull, parseTags } from '@/utils/tracking.ts'

export type TaskWriteValues = {
  title: string
  description: string | null
  stage_id: string
  category: string | null
  priority: TaskRow['priority']
  status: TaskRow['status']
  owner_id: string | null
  start_date: string | null
  due_date: string | null
  progress_percent: number
  notes: string | null
  tags: string[]
}

export type TaskWithRelations = TaskRow & {
  project_stages: Pick<StageRow, 'id' | 'name' | 'slug'> | null
  profiles: Pick<{ id: string; full_name: string }, 'id' | 'full_name'> | null
}

export async function fetchStages() {
  return getSupabase()
    .from('project_stages')
    .select('*, profiles!project_stages_owner_id_fkey ( id, full_name )')
    .order('sort_order')
}

export async function fetchStageBySlug(slug: string) {
  return getSupabase()
    .from('project_stages')
    .select('*, profiles!project_stages_owner_id_fkey ( id, full_name )')
    .eq('slug', slug)
    .maybeSingle()
}

export async function fetchStageItems(stageId: string) {
  return getSupabase().from('stage_items').select('*').eq('stage_id', stageId).order('sort_order')
}

export async function fetchAllStageItems() {
  return getSupabase().from('stage_items').select('id, stage_id, is_done, title')
}

export async function updateStageItemDone(itemId: string, isDone: boolean, userId: string) {
  return getSupabase()
    .from('stage_items')
    .update({ is_done: isDone, updated_by: userId })
    .eq('id', itemId)
}

export async function updateStageMeta(
  stageId: string,
  values: {
    status: StageRow['status']
    owner_id: string | null
    planned_start: string | null
    planned_end: string | null
    summary: string | null
    updated_by: string
  },
) {
  return getSupabase().from('project_stages').update(values).eq('id', stageId)
}

export async function recalculateStageProgress(stageId: string) {
  return getSupabase().rpc('recalculate_stage_progress', { p_stage_id: stageId })
}

export async function fetchTasks(filters?: {
  stageId?: string
  status?: TaskRow['status']
  search?: string
}) {
  let query = getSupabase()
    .from('tasks')
    .select('*, project_stages ( id, name, slug ), profiles!tasks_owner_id_fkey ( id, full_name )')
    .order('due_date', { nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.stageId) {
    query = query.eq('stage_id', filters.stageId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  return query
}

export async function fetchTask(taskId: string) {
  return getSupabase()
    .from('tasks')
    .select('*, project_stages ( id, name, slug ), profiles!tasks_owner_id_fkey ( id, full_name )')
    .eq('id', taskId)
    .maybeSingle()
}

export async function fetchTaskAssignees(taskId: string) {
  return getSupabase()
    .from('task_assignees')
    .select('id, user_id, profiles!task_assignees_user_id_fkey ( id, full_name )')
    .eq('task_id', taskId)
}

export async function fetchTaskDependencies(taskId: string) {
  return getSupabase()
    .from('task_dependencies')
    .select('id, depends_on_task_id, tasks!task_dependencies_depends_on_task_id_fkey ( id, title )')
    .eq('task_id', taskId)
}

export async function fetchAllDependencies() {
  return getSupabase().from('task_dependencies').select('task_id, depends_on_task_id')
}

export async function fetchTaskComments(taskId: string) {
  return getSupabase()
    .from('task_comments')
    .select('*, profiles!task_comments_created_by_fkey ( id, full_name )')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
}

export async function createTaskComment(taskId: string, body: string, userId: string) {
  return getSupabase().from('task_comments').insert({
    task_id: taskId,
    body,
    created_by: userId,
    updated_by: userId,
  })
}

export async function deleteTaskComment(commentId: string) {
  return getSupabase().from('task_comments').delete().eq('id', commentId)
}

export async function createTask(
  values: TaskWriteValues,
  assigneeIds: string[],
  dependsOnIds: string[],
  userId: string,
) {
  const client = getSupabase()
  const { data, error } = await client
    .from('tasks')
    .insert({ ...values, created_by: userId, updated_by: userId })
    .select('id, stage_id')
    .single()

  if (error || !data) {
    return { data: null, error }
  }

  await replaceAssignees(data.id, assigneeIds, userId)
  await replaceDependencies(data.id, dependsOnIds)
  await recalculateStageProgress(data.stage_id)
  return { data, error: null }
}

export async function updateTask(
  taskId: string,
  values: TaskWriteValues,
  assigneeIds: string[],
  dependsOnIds: string[],
  userId: string,
) {
  const client = getSupabase()
  const { data, error } = await client
    .from('tasks')
    .update({ ...values, updated_by: userId })
    .eq('id', taskId)
    .select('id, stage_id')
    .single()

  if (error || !data) {
    return { data: null, error }
  }

  await replaceAssignees(taskId, assigneeIds, userId)
  await replaceDependencies(taskId, dependsOnIds)
  await recalculateStageProgress(data.stage_id)
  return { data, error: null }
}

export async function deleteTask(taskId: string, stageId: string) {
  const { error } = await getSupabase().from('tasks').delete().eq('id', taskId)
  if (!error) {
    await recalculateStageProgress(stageId)
  }
  return { error }
}

async function replaceAssignees(taskId: string, userIds: string[], actorId: string) {
  const client = getSupabase()
  await client.from('task_assignees').delete().eq('task_id', taskId)
  if (userIds.length === 0) {
    return
  }

  await client.from('task_assignees').insert(
    userIds.map((userId) => ({
      task_id: taskId,
      user_id: userId,
      created_by: actorId,
    })),
  )
}

async function replaceDependencies(taskId: string, dependsOnIds: string[]) {
  const client = getSupabase()
  await client.from('task_dependencies').delete().eq('task_id', taskId)
  if (dependsOnIds.length === 0) {
    return
  }

  await client.from('task_dependencies').insert(
    dependsOnIds.map((dependsOnTaskId) => ({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
    })),
  )
}

export async function fetchMilestones(stageId?: string) {
  let query = getSupabase()
    .from('milestones')
    .select('*, project_stages ( id, name, slug ), profiles!milestones_owner_id_fkey ( id, full_name )')
    .order('target_date', { nullsFirst: false })

  if (stageId) {
    query = query.eq('stage_id', stageId)
  }

  return query
}

export async function upsertMilestone(
  values: Omit<MilestoneRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
) {
  const client = getSupabase()
  if (values.id) {
    const { id, ...rest } = values
    return client.from('milestones').update(rest).eq('id', id)
  }

  return client.from('milestones').insert(values)
}

export async function deleteMilestone(milestoneId: string) {
  return getSupabase().from('milestones').delete().eq('id', milestoneId)
}

export async function fetchProgressUpdates() {
  return getSupabase()
    .from('progress_updates')
    .select('*, project_stages ( id, name, slug ), profiles!progress_updates_created_by_fkey ( id, full_name )')
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function createProgressUpdate(
  values: Omit<ProgressUpdateRow, 'id' | 'created_at' | 'updated_at' | 'percent_previous' | 'percent_new'> & {
    percent_previous?: number
    percent_new?: number
  },
  relatedTaskIds: string[],
) {
  const client = getSupabase()
  const { data: stage } = await client
    .from('project_stages')
    .select('progress_percent')
    .eq('id', values.stage_id)
    .single()

  const { data, error } = await client
    .from('progress_updates')
    .insert({
      ...values,
      percent_previous: stage?.progress_percent ?? 0,
      percent_new: stage?.progress_percent ?? 0,
    })
    .select('id, stage_id')
    .single()

  if (error || !data) {
    return { data: null, error }
  }

  if (relatedTaskIds.length > 0) {
    await client.from('progress_update_tasks').insert(
      relatedTaskIds.map((taskId) => ({
        progress_update_id: data.id,
        task_id: taskId,
      })),
    )
  }

  const { data: nextPercent } = await recalculateStageProgress(data.stage_id)
  if (typeof nextPercent === 'number') {
    await client.from('progress_updates').update({ percent_new: nextPercent }).eq('id', data.id)
  }

  return { data, error: null }
}

export async function deleteProgressUpdate(id: string) {
  return getSupabase().from('progress_updates').delete().eq('id', id)
}

export async function fetchProfilesForSelect() {
  return getSupabase().from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
}

export async function fetchTaskCounts() {
  const { data, error } = await getSupabase().from('tasks').select('id, status, due_date')
  return { data, error }
}

export function toNullableStageFields(input: {
  owner_id?: string
  planned_start?: string
  planned_end?: string
  summary?: string
}) {
  return {
    owner_id: emptyToNull(input.owner_id),
    planned_start: emptyToNull(input.planned_start),
    planned_end: emptyToNull(input.planned_end),
    summary: emptyToNull(input.summary),
  }
}

export function toTaskWriteValues(values: TaskFormValues): TaskWriteValues {
  return {
    title: values.title,
    description: emptyToNull(values.description),
    stage_id: values.stage_id,
    category: emptyToNull(values.category),
    priority: values.priority,
    status: values.status,
    owner_id: emptyToNull(values.owner_id),
    start_date: emptyToNull(values.start_date),
    due_date: emptyToNull(values.due_date),
    progress_percent: values.status === 'finalizada' ? 100 : values.progress_percent,
    notes: emptyToNull(values.notes),
    tags: parseTags(values.tags),
  }
}

export type { MilestoneRow, ProgressUpdateRow, StageItemRow, StageRow, TaskCommentRow, TaskRow }
