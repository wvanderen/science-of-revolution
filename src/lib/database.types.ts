export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cohorts: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          visibility?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          roles: string[]
          primary_cohort_id: string | null
          avatar_url: string | null
          bio: string | null
          reader_preferences: {
            theme?: 'light' | 'dark' | 'sepia' | 'high-contrast'
            fontFamily?: 'serif' | 'sans'
            fontSize?: number
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          roles?: string[]
          primary_cohort_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          reader_preferences?: {
            theme?: 'light' | 'dark' | 'sepia' | 'high-contrast'
            fontFamily?: 'serif' | 'sans'
            fontSize?: number
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          roles?: string[]
          primary_cohort_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          reader_preferences?: {
            theme?: 'light' | 'dark' | 'sepia' | 'high-contrast'
            fontFamily?: 'serif' | 'sans'
            fontSize?: number
          }
          created_at?: string
          updated_at?: string
        }
      }
      user_cohorts: {
        Row: {
          user_id: string
          cohort_id: string
          joined_at: string
          added_by: string | null
        }
        Insert: {
          user_id: string
          cohort_id: string
          joined_at?: string
          added_by?: string | null
        }
        Update: {
          user_id?: string
          cohort_id?: string
          joined_at?: string
          added_by?: string | null
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          author: string | null
          type: string
          source_url: string | null
          storage_path: string
          sequence_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          type?: string
          source_url?: string | null
          storage_path: string
          sequence_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          type?: string
          source_url?: string | null
          storage_path?: string
          sequence_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      invite_codes: {
        Row: {
          code: string
          type: string
          max_uses: number | null
          uses: number
          expires_at: string | null
          cohort_id: string | null
          metadata: Json
          created_at: string
          created_by: string | null
        }
        Insert: {
          code: string
          type?: string
          max_uses?: number | null
          uses?: number
          expires_at?: string | null
          cohort_id?: string | null
          metadata?: Json
          created_at?: string
          created_by?: string | null
        }
        Update: {
          code?: string
          type?: string
          max_uses?: number | null
          uses?: number
          expires_at?: string | null
          cohort_id?: string | null
          metadata?: Json
          created_at?: string
          created_by?: string | null
        }
      }
      resource_sections: {
        Row: {
          id: string
          resource_id: string
          title: string
          order: number
          content_html: string
          content: string | null
          word_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          title: string
          order: number
          content_html: string
          content?: string | null
          word_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          title?: string
          order?: number
          content_html?: string
          content?: string | null
          word_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          resource_section_id: string
          start_pos: number
          end_pos: number
          text_content: string
          color: string
          visibility: 'private' | 'cohort' | 'global'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_section_id: string
          start_pos: number
          end_pos: number
          text_content: string
          color?: string
          visibility?: 'private' | 'cohort' | 'global'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_section_id?: string
          start_pos?: number
          end_pos?: number
          text_content?: string
          color?: string
          visibility?: 'private' | 'cohort' | 'global'
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          highlight_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          highlight_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          highlight_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          resource_section_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          scroll_percent: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_section_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          scroll_percent?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_section_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          scroll_percent?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      education_plans: {
        Row: {
          id: string
          title: string
          description: string | null
          cohort_id: string | null
          created_by: string
          is_template: boolean
          is_published: boolean
          estimated_weeks: number | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cohort_id?: string | null
          created_by: string
          is_template?: boolean
          is_published?: boolean
          estimated_weeks?: number | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cohort_id?: string | null
          created_by?: string
          is_template?: boolean
          is_published?: boolean
          estimated_weeks?: number | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      education_plan_topics: {
        Row: {
          id: string
          education_plan_id: string
          title: string
          description: string | null
          order_index: number
          estimated_hours: number | null
          is_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          education_plan_id: string
          title: string
          description?: string | null
          order_index: number
          estimated_hours?: number | null
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          education_plan_id?: string
          title?: string
          description?: string | null
          order_index?: number
          estimated_hours?: number | null
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      topic_readings: {
        Row: {
          id: string
          topic_id: string
          resource_id: string
          reading_type: 'required' | 'further' | 'optional'
          order_index: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          resource_id: string
          reading_type?: 'required' | 'further' | 'optional'
          order_index: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          resource_id?: string
          reading_type?: 'required' | 'further' | 'optional'
          order_index?: number
          notes?: string | null
        }
      }
      user_plan_progress: {
        Row: {
          id: string
          user_id: string
          education_plan_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
          current_topic_id: string | null
          progress_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          education_plan_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          current_topic_id?: string | null
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          education_plan_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          current_topic_id?: string | null
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_topic_progress: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
          progress_percentage: number
          reading_progress: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          progress_percentage?: number
          reading_progress?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          progress_percentage?: number
          reading_progress?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_invite_code_uses: {
        Args: {
          code_to_increment: string
        }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
