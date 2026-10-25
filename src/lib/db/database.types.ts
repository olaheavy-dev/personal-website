export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      assistant_evals: {
        Row: {
          created_at: string;
          expected_sources: string[];
          id: string;
          notes: string | null;
          question: string;
          should_refuse: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expected_sources?: string[];
          id?: string;
          notes?: string | null;
          question: string;
          should_refuse?: boolean;
        };
        Update: {
          created_at?: string;
          expected_sources?: string[];
          id?: string;
          notes?: string | null;
          question?: string;
          should_refuse?: boolean;
        };
        Relationships: [];
      };
      case_studies: {
        Row: {
          created_at: string;
          hero_media_id: string | null;
          id: string;
          published_at: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          stop_id: string | null;
          title: string;
          tldr: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          hero_media_id?: string | null;
          id?: string;
          published_at?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          stop_id?: string | null;
          title: string;
          tldr?: string[];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          hero_media_id?: string | null;
          id?: string;
          published_at?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          stop_id?: string | null;
          title?: string;
          tldr?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_studies_hero_media_id_fkey";
            columns: ["hero_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_studies_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: true;
            referencedRelation: "stops";
            referencedColumns: ["id"];
          },
        ];
      };
      case_study_sections: {
        Row: {
          anchor: Database["public"]["Enums"]["section_anchor"];
          body: string | null;
          case_study_id: string;
          id: string;
          position: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          anchor: Database["public"]["Enums"]["section_anchor"];
          body?: string | null;
          case_study_id: string;
          id?: string;
          position: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          anchor?: Database["public"]["Enums"]["section_anchor"];
          body?: string | null;
          case_study_id?: string;
          id?: string;
          position?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_study_sections_case_study_id_fkey";
            columns: ["case_study_id"];
            isOneToOne: false;
            referencedRelation: "case_studies";
            referencedColumns: ["id"];
          },
        ];
      };
      countries: {
        Row: {
          created_at: string;
          id: string;
          is_home: boolean;
          iso2: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          visited_year: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_home?: boolean;
          iso2: string;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          visited_year?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_home?: boolean;
          iso2?: string;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          visited_year?: number | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          state: Database["public"]["Enums"]["flag_state"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          state?: Database["public"]["Enums"]["flag_state"];
          updated_at?: string;
        };
        Update: {
          key?: string;
          state?: Database["public"]["Enums"]["flag_state"];
          updated_at?: string;
        };
        Relationships: [];
      };
      kb_chunks: {
        Row: {
          anchor: string | null;
          chunk_index: number;
          content: string;
          content_hash: string;
          embedding: string;
          fts: unknown;
          id: string;
          metadata: NonNullable<Json>;
          source_ref: string;
          source_type: Database["public"]["Enums"]["kb_source_type"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          anchor?: string | null;
          chunk_index: number;
          content: string;
          content_hash: string;
          embedding: string;
          fts?: never;
          id?: string;
          metadata?: NonNullable<Json>;
          source_ref: string;
          source_type: Database["public"]["Enums"]["kb_source_type"];
          updated_at?: string;
        };
        Update: {
          anchor?: string | null;
          chunk_index?: number;
          content?: string;
          content_hash?: string;
          embedding?: string;
          fts?: never;
          id?: string;
          metadata?: NonNullable<Json>;
          source_ref?: string;
          source_type?: Database["public"]["Enums"]["kb_source_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      lab_projects: {
        Row: {
          case_study_id: string | null;
          created_at: string;
          demo_url: string | null;
          id: string;
          in_progress: boolean;
          links_checked_on: string | null;
          live_url: string | null;
          name: string;
          position: number;
          repo_url: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          summary: string | null;
          updated_at: string;
          video_url: string | null;
          writeup_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          case_study_id?: string | null;
          created_at?: string;
          demo_url?: string | null;
          id?: string;
          in_progress?: boolean;
          links_checked_on?: string | null;
          live_url?: string | null;
          name: string;
          position?: number;
          repo_url?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          video_url?: string | null;
          writeup_url?: string | null;
        };
        Update: {
          case_study_id?: string | null;
          created_at?: string;
          demo_url?: string | null;
          id?: string;
          in_progress?: boolean;
          links_checked_on?: string | null;
          live_url?: string | null;
          name?: string;
          position?: number;
          repo_url?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          video_url?: string | null;
          writeup_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lab_projects_case_study_fk";
            columns: ["case_study_id"];
            isOneToOne: false;
            referencedRelation: "case_studies";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          alt: string | null;
          caption: string | null;
          created_at: string;
          height: number | null;
          id: string;
          is_ai_generated: boolean;
          kind: Database["public"]["Enums"]["media_kind"];
          status: Database["public"]["Enums"]["content_status"];
          storage_path: string;
          updated_at: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_ai_generated?: boolean;
          kind: Database["public"]["Enums"]["media_kind"];
          status?: Database["public"]["Enums"]["content_status"];
          storage_path: string;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt?: string | null;
          caption?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_ai_generated?: boolean;
          kind?: Database["public"]["Enums"]["media_kind"];
          status?: Database["public"]["Enums"]["content_status"];
          storage_path?: string;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      outcomes: {
        Row: {
          as_of_year: number | null;
          attribution: string | null;
          case_study_id: string | null;
          checked_on: string | null;
          claim_scope: Database["public"]["Enums"]["claim_scope"];
          created_at: string;
          description: string;
          figure: string;
          id: string;
          lab_project_id: string | null;
          position: number;
          source_kind: Database["public"]["Enums"]["source_kind"];
          source_label: string | null;
          source_note: string | null;
          source_url: string | null;
          stop_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          as_of_year?: number | null;
          attribution?: string | null;
          case_study_id?: string | null;
          checked_on?: string | null;
          claim_scope?: Database["public"]["Enums"]["claim_scope"];
          created_at?: string;
          description: string;
          figure: string;
          id?: string;
          lab_project_id?: string | null;
          position?: number;
          source_kind: Database["public"]["Enums"]["source_kind"];
          source_label?: string | null;
          source_note?: string | null;
          source_url?: string | null;
          stop_id?: string | null;
          updated_at?: string;
        };
        Update: {
          as_of_year?: number | null;
          attribution?: string | null;
          case_study_id?: string | null;
          checked_on?: string | null;
          claim_scope?: Database["public"]["Enums"]["claim_scope"];
          created_at?: string;
          description?: string;
          figure?: string;
          id?: string;
          lab_project_id?: string | null;
          position?: number;
          source_kind?: Database["public"]["Enums"]["source_kind"];
          source_label?: string | null;
          source_note?: string | null;
          source_url?: string | null;
          stop_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outcomes_case_study_id_fkey";
            columns: ["case_study_id"];
            isOneToOne: false;
            referencedRelation: "case_studies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outcomes_lab_project_id_fkey";
            columns: ["lab_project_id"];
            isOneToOne: false;
            referencedRelation: "lab_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outcomes_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: false;
            referencedRelation: "stops";
            referencedColumns: ["id"];
          },
        ];
      };
      photos: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          media_id: string;
          position: number;
          status: Database["public"]["Enums"]["content_status"];
          trip_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          media_id: string;
          position?: number;
          status?: Database["public"]["Enums"]["content_status"];
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          media_id?: string;
          position?: number;
          status?: Database["public"]["Enums"]["content_status"];
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: true;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      posts_cache: {
        Row: {
          canonical_url: string | null;
          cover_url: string | null;
          excerpt: string | null;
          fetched_at: string;
          hashnode_id: string;
          id: string;
          published_at: string;
          reading_minutes: number | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          tags: string[];
          title: string;
        };
        ComputedFields: never;
        Insert: {
          canonical_url?: string | null;
          cover_url?: string | null;
          excerpt?: string | null;
          fetched_at?: string;
          hashnode_id: string;
          id?: string;
          published_at: string;
          reading_minutes?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          tags?: string[];
          title: string;
        };
        Update: {
          canonical_url?: string | null;
          cover_url?: string | null;
          excerpt?: string | null;
          fetched_at?: string;
          hashnode_id?: string;
          id?: string;
          published_at?: string;
          reading_minutes?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          tags?: string[];
          title?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      stops: {
        Row: {
          created_at: string;
          end_year: number | null;
          filters: Database["public"]["Enums"]["stop_filter"][];
          id: string;
          kind: Database["public"]["Enums"]["stop_kind"];
          name: string;
          number: number;
          slug: string;
          stack: string[];
          start_year: number;
          status: Database["public"]["Enums"]["content_status"];
          summary: string | null;
          updated_at: string;
          via: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          end_year?: number | null;
          filters?: Database["public"]["Enums"]["stop_filter"][];
          id?: string;
          kind: Database["public"]["Enums"]["stop_kind"];
          name: string;
          number: number;
          slug: string;
          stack?: string[];
          start_year: number;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          via?: string | null;
        };
        Update: {
          created_at?: string;
          end_year?: number | null;
          filters?: Database["public"]["Enums"]["stop_filter"][];
          id?: string;
          kind?: Database["public"]["Enums"]["stop_kind"];
          name?: string;
          number?: number;
          slug?: string;
          stack?: string[];
          start_year?: number;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          via?: string | null;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          country_id: string;
          created_at: string;
          id: string;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
          year: number;
        };
        ComputedFields: never;
        Insert: {
          country_id: string;
          created_at?: string;
          id?: string;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
          year: number;
        };
        Update: {
          country_id?: string;
          created_at?: string;
          id?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "trips_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      claim_scope: "personal" | "company";
      content_status: "draft" | "published";
      flag_state: "on" | "preview" | "off";
      kb_source_type: "stop" | "case_study" | "lab_project" | "post" | "page";
      media_kind: "image" | "gif" | "video";
      section_anchor:
        "context" | "design" | "architecture" | "production" | "tradeoffs" | "results" | "reflection";
      source_kind: "link" | "own";
      stop_filter: "ai" | "payments" | "data_iot" | "edtech";
      stop_kind: "flagship" | "compact";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      claim_scope: ["personal", "company"],
      content_status: ["draft", "published"],
      flag_state: ["on", "preview", "off"],
      kb_source_type: ["stop", "case_study", "lab_project", "post", "page"],
      media_kind: ["image", "gif", "video"],
      section_anchor: [
        "context",
        "design",
        "architecture",
        "production",
        "tradeoffs",
        "results",
        "reflection",
      ],
      source_kind: ["link", "own"],
      stop_filter: ["ai", "payments", "data_iot", "edtech"],
      stop_kind: ["flagship", "compact"],
    },
  },
} as const;
