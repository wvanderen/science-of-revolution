export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cohorts: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      education_plan_topics: {
        Row: {
          created_at: string | null
          description: string | null
          education_plan_id: string | null
          estimated_hours: number | null
          id: string
          is_required: boolean | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          education_plan_id?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          education_plan_id?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_plan_topics_education_plan_id_fkey"
            columns: ["education_plan_id"]
            isOneToOne: false
            referencedRelation: "education_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      education_plans: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          estimated_weeks: number | null
          id: string
          is_published: boolean | null
          is_template: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_weeks?: number | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_weeks?: number | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_plans_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          cohort_id: string | null
          color: string
          created_at: string
          end_pos: number
          id: string
          resource_section_id: string
          start_pos: number
          text_content: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cohort_id?: string | null
          color?: string
          created_at?: string
          end_pos: number
          id?: string
          resource_section_id: string
          start_pos: number
          text_content: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cohort_id?: string | null
          color?: string
          created_at?: string
          end_pos?: number
          id?: string
          resource_section_id?: string
          start_pos?: number
          text_content?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_resource_section_id_fkey"
            columns: ["resource_section_id"]
            isOneToOne: false
            referencedRelation: "resource_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          cohort_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          max_uses: number | null
          metadata: Json
          type: string
          uses: number
        }
        Insert: {
          code: string
          cohort_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          max_uses?: number | null
          metadata?: Json
          type?: string
          uses?: number
        }
        Update: {
          code?: string
          cohort_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          max_uses?: number | null
          metadata?: Json
          type?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          highlight_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          highlight_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          highlight_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: true
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: true
            referencedRelation: "shared_notes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_reading_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          education_plan_id: string
          id: string
          reading_time_seconds: number | null
          resource_id: string
          scroll_progress: number | null
          sections_viewed: number | null
          session_end: string | null
          session_start: string
          topic_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          education_plan_id: string
          id?: string
          reading_time_seconds?: number | null
          resource_id: string
          scroll_progress?: number | null
          sections_viewed?: number | null
          session_end?: string | null
          session_start?: string
          topic_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          education_plan_id?: string
          id?: string
          reading_time_seconds?: number | null
          resource_id?: string
          scroll_progress?: number | null
          sections_viewed?: number | null
          session_end?: string | null
          session_start?: string
          topic_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_reading_sessions_education_plan_id_fkey"
            columns: ["education_plan_id"]
            isOneToOne: false
            referencedRelation: "education_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_reading_sessions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_reading_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "education_plan_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          primary_cohort_id: string | null
          privacy_settings: Json
          reading_preferences: Json
          roles: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          primary_cohort_id?: string | null
          privacy_settings?: Json
          reading_preferences?: Json
          roles?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          primary_cohort_id?: string | null
          privacy_settings?: Json
          reading_preferences?: Json
          roles?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_cohort_id_fkey"
            columns: ["primary_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          resource_section_id: string
          scroll_percent: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          resource_section_id: string
          scroll_percent?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          resource_section_id?: string
          scroll_percent?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_resource_section_id_fkey"
            columns: ["resource_section_id"]
            isOneToOne: false
            referencedRelation: "resource_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_sections: {
        Row: {
          content: string | null
          content_html: string
          created_at: string
          id: string
          order: number
          resource_id: string
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          content?: string | null
          content_html: string
          created_at?: string
          id?: string
          order: number
          resource_id: string
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          content?: string | null
          content_html?: string
          created_at?: string
          id?: string
          order?: number
          resource_id?: string
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_sections_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author: string | null
          created_at: string
          id: string
          sequence_order: number | null
          source_url: string | null
          storage_path: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          sequence_order?: number | null
          source_url?: string | null
          storage_path: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          sequence_order?: number | null
          source_url?: string | null
          storage_path?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      topic_readings: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_index: number
          reading_type: string | null
          resource_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_index: number
          reading_type?: string | null
          resource_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          reading_type?: string | null
          resource_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_readings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_readings_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "education_plan_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cohorts: {
        Row: {
          added_by: string | null
          cohort_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          cohort_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          cohort_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cohorts_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cohorts_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cohorts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_topic_id: string | null
          education_plan_id: string | null
          id: string
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_topic_id?: string | null
          education_plan_id?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_topic_id?: string | null
          education_plan_id?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_progress_current_topic_id_fkey"
            columns: ["current_topic_id"]
            isOneToOne: false
            referencedRelation: "education_plan_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plan_progress_education_plan_id_fkey"
            columns: ["education_plan_id"]
            isOneToOne: false
            referencedRelation: "education_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plan_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          progress_percentage: number | null
          reading_progress: Json | null
          started_at: string | null
          status: string | null
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          reading_progress?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          reading_progress?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "education_plan_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shared_notes_view: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          cohort_id: string | null
          cohort_name: string | null
          color: string | null
          created_at: string | null
          end_pos: number | null
          id: string | null
          is_author: boolean | null
          note_content: string | null
          resource_section_id: string | null
          start_pos: number | null
          text_content: string | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_resource_section_id_fkey"
            columns: ["resource_section_id"]
            isOneToOne: false
            referencedRelation: "resource_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_plan_progress: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: number
      }
      get_plan_reading_time: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: number
      }
      get_topic_reading_time: {
        Args: { p_topic_id: string; p_user_id: string }
        Returns: number
      }
      get_user_cohort_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_user_reading_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_invite_code_uses: {
        Args: { code_to_increment: string }
        Returns: undefined
      }
      revert_20251115001_profile_extensions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_facilitator_role: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

