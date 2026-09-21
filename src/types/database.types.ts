export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Tipos alineados con las migraciones de `supabase/migrations`.
 * Regenerar cuando exista stack local o proyecto vinculado:
 * `npm run gen:types`
 * o `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`
 */
export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          locale: string
          project_name: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string
          project_name?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          project_name?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'app_settings_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          code: Database['public']['Enums']['app_role']
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: Database['public']['Enums']['app_role']
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: Database['public']['Enums']['app_role']
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      project_stages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_id: string | null
          planned_end: string | null
          planned_start: string | null
          progress_percent: number
          slug: string
          sort_order: number
          status: Database['public']['Enums']['stage_status']
          summary: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          progress_percent?: number
          slug: string
          sort_order: number
          status?: Database['public']['Enums']['stage_status']
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          progress_percent?: number
          slug?: string
          sort_order?: number
          status?: Database['public']['Enums']['stage_status']
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'project_stages_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_stages_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_stages_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      stage_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_done: boolean
          owner_id: string | null
          sort_order: number
          stage_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          sort_order?: number
          stage_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          sort_order?: number
          stage_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stage_items_stage_id_fkey'
            columns: ['stage_id']
            isOneToOne: false
            referencedRelation: 'project_stages'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          owner_id: string | null
          priority: Database['public']['Enums']['task_priority']
          progress_percent: number
          stage_id: string
          start_date: string | null
          status: Database['public']['Enums']['task_status']
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          priority?: Database['public']['Enums']['task_priority']
          progress_percent?: number
          stage_id: string
          start_date?: string | null
          status?: Database['public']['Enums']['task_status']
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          priority?: Database['public']['Enums']['task_priority']
          progress_percent?: number
          stage_id?: string
          start_date?: string | null
          status?: Database['public']['Enums']['task_status']
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_stage_id_fkey'
            columns: ['stage_id']
            isOneToOne: false
            referencedRelation: 'project_stages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_assignees_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_assignees_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_dependencies_depends_on_task_id_fkey'
            columns: ['depends_on_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      task_comments: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          task_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'task_comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          evidence: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          reached_date: string | null
          stage_id: string
          status: Database['public']['Enums']['milestone_status']
          target_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          reached_date?: string | null
          stage_id: string
          status?: Database['public']['Enums']['milestone_status']
          target_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          reached_date?: string | null
          stage_id?: string
          status?: Database['public']['Enums']['milestone_status']
          target_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'milestones_stage_id_fkey'
            columns: ['stage_id']
            isOneToOne: false
            referencedRelation: 'project_stages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'milestones_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      progress_updates: {
        Row: {
          created_at: string
          created_by: string | null
          decisions_taken: string | null
          description: string | null
          difficulties: string | null
          id: string
          next_steps: string | null
          occurred_on: string
          percent_new: number
          percent_previous: number
          stage_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decisions_taken?: string | null
          description?: string | null
          difficulties?: string | null
          id?: string
          next_steps?: string | null
          occurred_on?: string
          percent_new?: number
          percent_previous?: number
          stage_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decisions_taken?: string | null
          description?: string | null
          difficulties?: string | null
          id?: string
          next_steps?: string | null
          occurred_on?: string
          percent_new?: number
          percent_previous?: number
          stage_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'progress_updates_stage_id_fkey'
            columns: ['stage_id']
            isOneToOne: false
            referencedRelation: 'project_stages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'progress_updates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      progress_update_tasks: {
        Row: {
          id: string
          progress_update_id: string
          task_id: string
        }
        Insert: {
          id?: string
          progress_update_id: string
          task_id: string
        }
        Update: {
          id?: string
          progress_update_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'progress_update_tasks_progress_update_id_fkey'
            columns: ['progress_update_id']
            isOneToOne: false
            referencedRelation: 'progress_updates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'progress_update_tasks_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_role: {
        Args: Record<string, never>
        Returns: Database['public']['Enums']['app_role']
      }
      is_active_user: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_staff: {
        Args: Record<string, never>
        Returns: boolean
      }
      can_write_project: {
        Args: Record<string, never>
        Returns: boolean
      }
      can_edit_task: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      recalculate_stage_progress: {
        Args: { p_stage_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: 'administrador' | 'socio' | 'colaborador' | 'solo_lectura'
      stage_status: 'no_iniciada' | 'planificada' | 'en_curso' | 'bloqueada' | 'completada' | 'pausada'
      task_status: 'pendiente' | 'en_curso' | 'bloqueada' | 'finalizada'
      task_priority: 'baja' | 'media' | 'alta' | 'critica'
      milestone_status: 'pendiente' | 'alcanzado' | 'cancelado'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type AppRole = Database['public']['Enums']['app_role']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type RoleRow = Database['public']['Tables']['roles']['Row']
export type StageRow = Database['public']['Tables']['project_stages']['Row']
export type StageItemRow = Database['public']['Tables']['stage_items']['Row']
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type MilestoneRow = Database['public']['Tables']['milestones']['Row']
export type ProgressUpdateRow = Database['public']['Tables']['progress_updates']['Row']
export type TaskCommentRow = Database['public']['Tables']['task_comments']['Row']
