export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          requirement_metric: string | null
          requirement_type: string
          requirement_value: number
          slug: string
          tier: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          requirement_metric?: string | null
          requirement_type: string
          requirement_value: number
          slug: string
          tier?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          requirement_metric?: string | null
          requirement_type?: string
          requirement_value?: number
          slug?: string
          tier?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_actions: {
        Row: {
          action_type: string
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          params: Json
          result: Json | null
          rollback_data: Json | null
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          params: Json
          result?: Json | null
          rollback_data?: Json | null
          status: string
          user_id: string
        }
        Update: {
          action_type?: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          params?: Json
          result?: Json | null
          rollback_data?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          context_snapshot: Json | null
          created_at: string | null
          id: string
          is_read: boolean | null
          priority: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          tokens_used: number | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string | null
          filename: string
          id: string
          mime_type: string | null
          original_name: string
          size: number | null
          task_id: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          filename: string
          id?: string
          mime_type?: string | null
          original_name: string
          size?: number | null
          task_id?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          filename?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          size?: number | null
          task_id?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_status: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_tasks: number | null
          created_at: string | null
          id: string
          paused_at: string | null
          pending_tasks: number | null
          progress_percentage: number | null
          service_template_id: string
          started_at: string | null
          status: string | null
          total_tasks: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          paused_at?: string | null
          pending_tasks?: number | null
          progress_percentage?: number | null
          service_template_id: string
          started_at?: string | null
          status?: string | null
          total_tasks?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          paused_at?: string | null
          pending_tasks?: number | null
          progress_percentage?: number | null
          service_template_id?: string
          started_at?: string | null
          status?: string | null
          total_tasks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_status_service_template_id_fkey"
            columns: ["service_template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          acquisition_cost: number | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person: string | null
          contract_start_date: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          logo_url: string | null
          monthly_value: number | null
          notes: string | null
          payment_due_day: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phone: string | null
          segment: Database["public"]["Enums"]["client_segment"] | null
          status: Database["public"]["Enums"]["client_status"] | null
          updated_at: string | null
        }
        Insert: {
          acquisition_cost?: number | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_value?: number | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phone?: string | null
          segment?: Database["public"]["Enums"]["client_segment"] | null
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string | null
        }
        Update: {
          acquisition_cost?: number | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string
          contact_person?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_value?: number | null
          notes?: string | null
          payment_due_day?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phone?: string | null
          segment?: Database["public"]["Enums"]["client_segment"] | null
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          clients_current: number | null
          clients_suggested: number | null
          clients_target: number | null
          created_at: string | null
          end_date: string
          id: string
          is_confirmed: boolean | null
          month: string
          mrr_current: number | null
          mrr_suggested: number | null
          mrr_target: number | null
          period_type: Database["public"]["Enums"]["goal_period_type"] | null
          projects_current: number | null
          projects_suggested: number | null
          projects_target: number | null
          start_date: string
          status: string | null
          tasks_current: number | null
          tasks_suggested: number | null
          tasks_target: number | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clients_current?: number | null
          clients_suggested?: number | null
          clients_target?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          is_confirmed?: boolean | null
          month: string
          mrr_current?: number | null
          mrr_suggested?: number | null
          mrr_target?: number | null
          period_type?: Database["public"]["Enums"]["goal_period_type"] | null
          projects_current?: number | null
          projects_suggested?: number | null
          projects_target?: number | null
          start_date: string
          status?: string | null
          tasks_current?: number | null
          tasks_suggested?: number | null
          tasks_target?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clients_current?: number | null
          clients_suggested?: number | null
          clients_target?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_confirmed?: boolean | null
          month?: string
          mrr_current?: number | null
          mrr_suggested?: number | null
          mrr_target?: number | null
          period_type?: Database["public"]["Enums"]["goal_period_type"] | null
          projects_current?: number | null
          projects_suggested?: number | null
          projects_target?: number | null
          start_date?: string
          status?: string | null
          tasks_current?: number | null
          tasks_suggested?: number | null
          tasks_target?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          related_project_id: string | null
          related_task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          related_project_id?: string | null
          related_task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          related_project_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          due_date: string
          id: string
          installment_number: number | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_date: string | null
          percentage: number | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          installment_number?: number | null
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_date?: string | null
          percentage?: number | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_date?: string | null
          percentage?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_loss_stage: boolean | null
          is_win_stage: boolean | null
          name: string
          position: number
          probability: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_loss_stage?: boolean | null
          is_win_stage?: boolean | null
          name: string
          position?: number
          probability?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_loss_stage?: boolean | null
          is_win_stage?: boolean | null
          name?: string
          position?: number
          probability?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          original_name: string
          project_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          original_name: string
          project_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          original_name?: string
          project_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_interactions: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          from_stage_id: string | null
          id: string
          prospect_id: string
          title: string
          to_stage_id: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          from_stage_id?: string | null
          id?: string
          prospect_id: string
          title: string
          to_stage_id?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          from_stage_id?: string | null
          id?: string
          prospect_id?: string
          title?: string
          to_stage_id?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_interactions_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "prospect_interactions_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_interactions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_interactions_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "prospect_interactions_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_tags: {
        Row: {
          prospect_id: string
          tag_id: string
        }
        Insert: {
          prospect_id: string
          tag_id: string
        }
        Update: {
          prospect_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_tags_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          company_name: string | null
          converted_at: string | null
          converted_client_id: string | null
          created_at: string | null
          email: string | null
          entered_stage_at: string | null
          expected_close_date: string | null
          expected_value: number | null
          id: string
          last_interaction_at: string | null
          name: string
          notes: string | null
          phone: string | null
          position_in_stage: number | null
          priority: Database["public"]["Enums"]["prospect_priority"] | null
          source: string | null
          stage_id: string
          status: Database["public"]["Enums"]["prospect_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          entered_stage_at?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          id?: string
          last_interaction_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position_in_stage?: number | null
          priority?: Database["public"]["Enums"]["prospect_priority"] | null
          source?: string | null
          stage_id: string
          status?: Database["public"]["Enums"]["prospect_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          entered_stage_at?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          id?: string
          last_interaction_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position_in_stage?: number | null
          priority?: Database["public"]["Enums"]["prospect_priority"] | null
          source?: string | null
          stage_id?: string
          status?: Database["public"]["Enums"]["prospect_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "prospects_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_checkins: {
        Row: {
          ai_suggestions: Json | null
          ai_summary: string | null
          completed_at: string | null
          created_at: string | null
          date: string
          id: string
          questions_asked: Json | null
          responses: Json | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          questions_asked?: Json | null
          responses?: Json | null
          trigger_type: string
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          questions_asked?: Json | null
          responses?: Json | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_daily_activities: {
        Row: {
          ai_feedback: string | null
          calls_made: number | null
          contacts_sent: number | null
          created_at: string | null
          date: string
          deals_closed: number | null
          id: string
          leads_qualified: number | null
          meetings_held: number | null
          notes: string | null
          proposals_sent: number | null
          revenue_generated: number | null
          service_automation: number | null
          service_bugs: number | null
          service_sites: number | null
          service_traffic: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          calls_made?: number | null
          contacts_sent?: number | null
          created_at?: string | null
          date?: string
          deals_closed?: number | null
          id?: string
          leads_qualified?: number | null
          meetings_held?: number | null
          notes?: string | null
          proposals_sent?: number | null
          revenue_generated?: number | null
          service_automation?: number | null
          service_bugs?: number | null
          service_sites?: number | null
          service_traffic?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          calls_made?: number | null
          contacts_sent?: number | null
          created_at?: string | null
          date?: string
          deals_closed?: number | null
          id?: string
          leads_qualified?: number | null
          meetings_held?: number | null
          notes?: string | null
          proposals_sent?: number | null
          revenue_generated?: number | null
          service_automation?: number | null
          service_bugs?: number | null
          service_sites?: number | null
          service_traffic?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales_goals: {
        Row: {
          calls_target: number | null
          contacts_target: number | null
          created_at: string | null
          deals_target: number | null
          end_date: string
          id: string
          leads_target: number | null
          meetings_target: number | null
          period_type: string
          proposals_target: number | null
          revenue_target: number | null
          start_date: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calls_target?: number | null
          contacts_target?: number | null
          created_at?: string | null
          deals_target?: number | null
          end_date: string
          id?: string
          leads_target?: number | null
          meetings_target?: number | null
          period_type: string
          proposals_target?: number | null
          revenue_target?: number | null
          start_date: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calls_target?: number | null
          contacts_target?: number | null
          created_at?: string | null
          deals_target?: number | null
          end_date?: string
          id?: string
          leads_target?: number | null
          meetings_target?: number | null
          period_type?: string
          proposals_target?: number | null
          revenue_target?: number | null
          start_date?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales_strategies: {
        Row: {
          action_items: Json | null
          based_on_analysis: string | null
          created_at: string | null
          description: string
          expected_impact: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          based_on_analysis?: string | null
          created_at?: string | null
          description: string
          expected_impact?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          based_on_analysis?: string | null
          created_at?: string | null
          description?: string
          expected_impact?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_templates: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time: number | null
          assignee_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_time: number | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress: number | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_time?: number | null
          assignee_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_time?: number | null
          assignee_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          manager_id: string | null
          name: string
          permissions: Json | null
          role: Database["public"]["Enums"]["team_role"]
          status: string | null
        }
        Insert: {
          created_at?: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          manager_id?: string | null
          name: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["team_role"]
          status?: string | null
        }
        Update: {
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          manager_id?: string | null
          name?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          department: Database["public"]["Enums"]["department"]
          hire_date: string | null
          id: string
          manager_id: string | null
          notes: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["team_role"]
          salary: number | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department: Database["public"]["Enums"]["department"]
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          permissions?: Json | null
          role: Database["public"]["Enums"]["team_role"]
          salary?: number | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["team_role"]
          salary?: number | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      template_projects: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_required: boolean | null
          name: string
          service_template_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_required?: boolean | null
          name: string
          service_template_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_required?: boolean | null
          name?: string
          service_template_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_projects_service_template_id_fkey"
            columns: ["service_template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tasks: {
        Row: {
          assigned_to_role: string | null
          category: string | null
          created_at: string | null
          days_after_start: number | null
          depends_on_task_id: string | null
          description: string | null
          id: string
          is_required: boolean | null
          sort_order: number | null
          template_project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_role?: string | null
          category?: string | null
          created_at?: string | null
          days_after_start?: number | null
          depends_on_task_id?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          template_project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_role?: string | null
          category?: string | null
          created_at?: string | null
          days_after_start?: number | null
          depends_on_task_id?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          template_project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_tasks_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "template_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_tasks_template_project_id_fkey"
            columns: ["template_project_id"]
            isOneToOne: false
            referencedRelation: "template_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string | null
          current_level: number | null
          id: string
          total_calls: number | null
          total_contacts: number | null
          total_deals: number | null
          total_meetings: number | null
          total_points: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          xp_current: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          total_calls?: number | null
          total_contacts?: number | null
          total_deals?: number | null
          total_meetings?: number | null
          total_points?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          xp_current?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          total_calls?: number | null
          total_contacts?: number | null
          total_deals?: number | null
          total_meetings?: number | null
          total_points?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          xp_current?: number | null
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          last_activity_date: string | null
          longest_count: number | null
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          last_activity_date?: string | null
          longest_count?: number | null
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          last_activity_date?: string | null
          longest_count?: number | null
          streak_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      pipeline_metrics: {
        Row: {
          color: string | null
          position: number | null
          probability: number | null
          prospect_count: number | null
          stage_id: string | null
          stage_name: string | null
          total_value: number | null
          user_id: string | null
          weighted_value: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_overdue_tasks: { Args: never; Returns: undefined }
      check_upcoming_tasks: { Args: never; Returns: undefined }
      convert_prospect_to_client: {
        Args: { p_prospect_id: string; p_user_id: string }
        Returns: string
      }
      create_default_pipeline_stages: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_goal_insights: {
        Args: { p_user_id: string }
        Returns: {
          insight_type: string
          message: string
          metric: string
          priority: number
        }[]
      }
      get_current_goals: {
        Args: { p_user_id: string }
        Returns: {
          clients_current: number
          clients_progress: number
          clients_target: number
          created_at: string
          id: string
          is_confirmed: boolean
          month: string
          mrr_current: number
          mrr_progress: number
          mrr_target: number
          projects_current: number
          projects_progress: number
          projects_target: number
          tasks_current: number
          tasks_progress: number
          tasks_target: number
          updated_at: string
        }[]
      }
      move_prospect_to_stage: {
        Args: {
          p_new_position: number
          p_prospect_id: string
          p_target_stage_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      process_auto_insights: { Args: never; Returns: undefined }
      suggest_goals_for_user: {
        Args: { p_user_id: string }
        Returns: {
          clients_suggested: number
          mrr_suggested: number
          projects_suggested: number
          tasks_suggested: number
        }[]
      }
      update_goal_progress: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      client_segment:
        | "technology"
        | "healthcare"
        | "education"
        | "finance"
        | "retail"
        | "manufacturing"
        | "services"
        | "other"
        | "chatbot"
        | "website_automation"
        | "n8n_automation"
        | "defy_automation"
        | "agno_automation"
        | "langchain_automation"
        | "web_development"
        | "software_development"
        | "bug_fixing"
        | "landing_pages"
        | "microsites"
        | "web_design"
        | "ui_ux_design"
        | "traffic_management"
        | "seo"
        | "consulting"
        | "maintenance"
      client_status: "active" | "inactive" | "trial" | "churned" | "completed"
      client_type: "recurring" | "freelance"
      department:
        | "engineering"
        | "product"
        | "design"
        | "marketing"
        | "sales"
        | "customer_success"
        | "finance"
        | "hr"
        | "operations"
        | "other"
      goal_period_type:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "custom"
      interaction_type:
        | "call"
        | "email"
        | "meeting"
        | "whatsapp"
        | "linkedin"
        | "proposal_sent"
        | "follow_up"
        | "note"
        | "stage_change"
        | "other"
      member_status: "active" | "inactive" | "on_leave" | "terminated"
      payment_method:
        | "credit_card"
        | "bank_transfer"
        | "pix"
        | "boleto"
        | "paypal"
        | "other"
      payment_status: "paid" | "pending" | "overdue" | "cancelled"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      prospect_priority: "low" | "medium" | "high" | "urgent"
      prospect_status: "open" | "won" | "lost" | "archived"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "archived"
      team_role:
        | "ceo"
        | "c_level"
        | "director"
        | "manager"
        | "team_lead"
        | "senior"
        | "mid_level"
        | "junior"
        | "intern"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_segment: [
        "technology",
        "healthcare",
        "education",
        "finance",
        "retail",
        "manufacturing",
        "services",
        "other",
        "chatbot",
        "website_automation",
        "n8n_automation",
        "defy_automation",
        "agno_automation",
        "langchain_automation",
        "web_development",
        "software_development",
        "bug_fixing",
        "landing_pages",
        "microsites",
        "web_design",
        "ui_ux_design",
        "traffic_management",
        "seo",
        "consulting",
        "maintenance",
      ],
      client_status: ["active", "inactive", "trial", "churned", "completed"],
      client_type: ["recurring", "freelance"],
      department: [
        "engineering",
        "product",
        "design",
        "marketing",
        "sales",
        "customer_success",
        "finance",
        "hr",
        "operations",
        "other",
      ],
      goal_period_type: [
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "custom",
      ],
      interaction_type: [
        "call",
        "email",
        "meeting",
        "whatsapp",
        "linkedin",
        "proposal_sent",
        "follow_up",
        "note",
        "stage_change",
        "other",
      ],
      member_status: ["active", "inactive", "on_leave", "terminated"],
      payment_method: [
        "credit_card",
        "bank_transfer",
        "pix",
        "boleto",
        "paypal",
        "other",
      ],
      payment_status: ["paid", "pending", "overdue", "cancelled"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      prospect_priority: ["low", "medium", "high", "urgent"],
      prospect_status: ["open", "won", "lost", "archived"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "archived"],
      team_role: [
        "ceo",
        "c_level",
        "director",
        "manager",
        "team_lead",
        "senior",
        "mid_level",
        "junior",
        "intern",
      ],
    },
  },
} as const
