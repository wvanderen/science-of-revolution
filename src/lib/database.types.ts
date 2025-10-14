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
