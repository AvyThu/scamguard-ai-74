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
      analysis_history: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          input_summary: string | null
          result: Json | null
          risk_level: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          input_summary?: string | null
          result?: Json | null
          risk_level?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          input_summary?: string | null
          result?: Json | null
          risk_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          cluster: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          risk_level: string | null
        }
        Insert: {
          cluster?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          risk_level?: string | null
        }
        Update: {
          cluster?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          risk_level?: string | null
        }
        Relationships: []
      }
      cyber_stats: {
        Row: {
          id: string
          label: string
          metric_key: string
          source: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          metric_key: string
          source?: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          metric_key?: string
          source?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      education_content: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          content: string | null
          created_at: string
          id: string
          published_at: string | null
          source: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          elderly_mode: boolean | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          elderly_mode?: boolean | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          elderly_mode?: boolean | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scam_intel_campaigns: {
        Row: {
          cluster: string | null
          created_at: string
          description: string | null
          id: string
          impersonated_brand: string | null
          keywords: string[]
          reported_date: string | null
          severity: string
          source_org: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cluster?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impersonated_brand?: string | null
          keywords?: string[]
          reported_date?: string | null
          severity?: string
          source_org: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cluster?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impersonated_brand?: string | null
          keywords?: string[]
          reported_date?: string | null
          severity?: string
          source_org?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scam_reports: {
        Row: {
          category: string
          cluster: string | null
          created_at: string
          description: string
          estimated_loss: number | null
          id: string
          incident_date: string | null
          is_anonymous: boolean | null
          platform: string | null
          region: string | null
          screenshot_url: string | null
          status: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          cluster?: string | null
          created_at?: string
          description: string
          estimated_loss?: number | null
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean | null
          platform?: string | null
          region?: string | null
          screenshot_url?: string | null
          status?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          cluster?: string | null
          created_at?: string
          description?: string
          estimated_loss?: number | null
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean | null
          platform?: string | null
          region?: string | null
          screenshot_url?: string | null
          status?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      url_blacklist: {
        Row: {
          cluster: string | null
          created_at: string
          id: string
          reason: string | null
          url_pattern: string
        }
        Insert: {
          cluster?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          url_pattern: string
        }
        Update: {
          cluster?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          url_pattern?: string
        }
        Relationships: []
      }
      url_whitelist: {
        Row: {
          created_at: string
          id: string
          note: string | null
          url_pattern: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          url_pattern: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          url_pattern?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
