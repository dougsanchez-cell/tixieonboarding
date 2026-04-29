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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      compensation_unlocks: {
        Row: {
          email: string
          id: string
          unlocked_at: string
        }
        Insert: {
          email: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          email?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      content_modules: {
        Row: {
          abbr: string
          accent: string | null
          comprehension_questions: Json | null
          duration: string | null
          id: number
          light: string | null
          module_number: number
          sections: Json
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          abbr: string
          accent?: string | null
          comprehension_questions?: Json | null
          duration?: string | null
          id?: number
          light?: string | null
          module_number: number
          sections?: Json
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          abbr?: string
          accent?: string | null
          comprehension_questions?: Json | null
          duration?: string | null
          id?: number
          light?: string | null
          module_number?: number
          sections?: Json
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      contractors: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string
          id: string
          name: string
          path: string | null
          phone: string
          quiz_attempts: number
          quiz_score: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          path?: string | null
          phone: string
          quiz_attempts?: number
          quiz_score?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          path?: string | null
          phone?: string
          quiz_attempts?: number
          quiz_score?: number | null
          status?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: number
          options: Json
          question_number: number
          question_text: string
          updated_at: string
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: number
          options?: Json
          question_number: number
          question_text: string
          updated_at?: string
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: number
          options?: Json
          question_number?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          contractor_id: string
          event_at: string
          event_type: string
          id: number
          step_name: string
        }
        Insert: {
          contractor_id: string
          event_at?: string
          event_type: string
          id?: number
          step_name: string
        }
        Update: {
          contractor_id?: string
          event_at?: string
          event_type?: string
          id?: number
          step_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_contractor_email: {
        Args: { _email: string }
        Returns: {
          id: string
          status: string
        }[]
      }
      get_quiz_questions: {
        Args: never
        Returns: {
          id: number
          options: Json
          question_number: number
          question_text: string
        }[]
      }
      get_returning_contractor: {
        Args: { _email: string }
        Returns: {
          email: string
          id: string
          name: string
          phone: string
        }[]
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
  public: {
    Enums: {},
  },
} as const
