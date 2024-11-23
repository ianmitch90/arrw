export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TrustLevel = 'precise' | 'approximate' | 'area'
export type UserRole = 'admin' | 'moderator' | 'subscriber' | 'free' | 'anon'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'deleted' | 'pending_verification'
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise' | 'lifetime' | 'trial'
export type AgeVerificationMethod = 'modal' | 'document' | 'id_check' | 'credit_card' | 'phone'

export interface PrivacySettings {
  show_online_status: boolean;
  show_last_active: boolean;
  show_location: 'friends' | 'public' | 'none';
  show_stories: 'public' | 'friends' | 'none';
  allow_messages: 'all' | 'verified' | 'friends' | 'none';
}

export interface DefaultPrivacyRules {
  strangers: TrustLevel;
  authenticated: TrustLevel;
  trusted: TrustLevel;
  schedule_enabled: boolean;
}

export type Database = {
  public: {
    Tables: {
      age_verifications: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          birth_date: string | null
          created_at: string
          id: string
          method: AgeVerificationMethod | null
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          method?: AgeVerificationMethod | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          method?: AgeVerificationMethod | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      place_proposals: {
        Row: {
          changes: Json
          created_at: string
          id: string
          place_id: string | null
          proposed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          changes: Json
          created_at?: string
          id?: string
          place_id?: string | null
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          changes?: Json
          created_at?: string
          id?: string
          place_id?: string | null
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_proposals_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          }
        ]
      }
      places: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: PostGISPoint
          metadata: Json | null
          name: string
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location: PostGISPoint
          metadata?: Json | null
          name: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: PostGISPoint
          metadata?: Json | null
          name?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avg_response_time: unknown | null
          blocked_users: string[] | null
          body_type: string | null
          boost_active_until: string | null
          cannabis_status: string | null
          children_status: string | null
          company: string | null
          completion_percentage: number | null
          deal_breakers: string[] | null
          diet_preferences: string[] | null
          display_name: string | null
          drinking_status: string | null
          education_level: string | null
          endowment: string | null
          ethnicity: string[] | null
          expression: string[] | null
          eye_color: string | null
          favorite_users: string[] | null
          followers_count: number | null
          following_count: number | null
          gallery_picture_urls: string[] | null
          hair_color: string | null
          height: number | null
          hiv_status: string | null
          hiv_tested_date: string | null
          hobbies: string[] | null
          i_carry: string[] | null
          id: string
          income_range: string | null
          interests: string[] | null
          into_public: string[] | null
          is_featured: boolean | null
          kinks: string[] | null
          languages: string[] | null
          last_location: PostGISPoint | null
          last_updated: string | null
          like_count: number | null
          looking_for: string[] | null
          match_count: number | null
          not_comfortable_with: string[] | null
          occupation: string | null
          orientation: Database["public"]["Enums"]["sexual_orientation"] | null
          pets: string[] | null
          political_views: string | null
          position: string | null
          position_preferences: string[] | null
          practices: string[] | null
          privacy_settings: PrivacySettings | null
          profile_picture_url: string | null
          profile_quality_score: number | null
          profile_slug: string | null
          profile_views: number | null
          relationship_status: Database["public"]["Enums"]["relationship_status"] | null
          religion: string | null
          response_rate: number | null
          safeguards: string[] | null
          school: string | null
          smoking_status: string | null
          sti_tested_date: string | null
          subscription_tier: SubscriptionTier | null
          user_role: UserRole | null
          user_status: UserStatus | null
          vaccination_status: Json | null
          verification_date: string | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
          verified_badges: string[] | null
          video_urls: string[] | null
          voice_intro_url: string | null
          weight: number | null
        }
        Insert: {
          avg_response_time?: unknown | null
          blocked_users?: string[] | null
          body_type?: string | null
          boost_active_until?: string | null
          cannabis_status?: string | null
          children_status?: string | null
          company?: string | null
          completion_percentage?: number | null
          deal_breakers?: string[] | null
          diet_preferences?: string[] | null
          display_name?: string | null
          drinking_status?: string | null
          education_level?: string | null
          endowment?: string | null
          ethnicity?: string[] | null
          expression?: string[] | null
          eye_color?: string | null
          favorite_users?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gallery_picture_urls?: string[] | null
          hair_color?: string | null
          height?: number | null
          hiv_status?: string | null
          hiv_tested_date?: string | null
          hobbies?: string[] | null
          i_carry?: string[] | null
          id: string
          income_range?: string | null
          interests?: string[] | null
          into_public?: string[] | null
          is_featured?: boolean | null
          kinks?: string[] | null
          languages?: string[] | null
          last_location?: PostGISPoint | null
          last_updated?: string | null
          like_count?: number | null
          looking_for?: string[] | null
          match_count?: number | null
          not_comfortable_with?: string[] | null
          occupation?: string | null
          orientation?: Database["public"]["Enums"]["sexual_orientation"] | null
          pets?: string[] | null
          political_views?: string | null
          position?: string | null
          position_preferences?: string[] | null
          practices?: string[] | null
          privacy_settings?: PrivacySettings | null
          profile_picture_url?: string | null
          profile_quality_score?: number | null
          profile_slug?: string | null
          profile_views?: number | null
          relationship_status?: Database["public"]["Enums"]["relationship_status"] | null
          religion?: string | null
          response_rate?: number | null
          safeguards?: string[] | null
          school?: string | null
          smoking_status?: string | null
          sti_tested_date?: string | null
          subscription_tier?: SubscriptionTier | null
          user_role?: UserRole | null
          user_status?: UserStatus | null
          vaccination_status?: Json | null
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          verified_badges?: string[] | null
          video_urls?: string[] | null
          voice_intro_url?: string | null
          weight?: number | null
        }
        Update: {
          avg_response_time?: unknown | null
          blocked_users?: string[] | null
          body_type?: string | null
          boost_active_until?: string | null
          cannabis_status?: string | null
          children_status?: string | null
          company?: string | null
          completion_percentage?: number | null
          deal_breakers?: string[] | null
          diet_preferences?: string[] | null
          display_name?: string | null
          drinking_status?: string | null
          education_level?: string | null
          endowment?: string | null
          ethnicity?: string[] | null
          expression?: string[] | null
          eye_color?: string | null
          favorite_users?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gallery_picture_urls?: string[] | null
          hair_color?: string | null
          height?: number | null
          hiv_status?: string | null
          hiv_tested_date?: string | null
          hobbies?: string[] | null
          i_carry?: string[] | null
          id?: string
          income_range?: string | null
          interests?: string[] | null
          into_public?: string[] | null
          is_featured?: boolean | null
          kinks?: string[] | null
          languages?: string[] | null
          last_location?: PostGISPoint | null
          last_updated?: string | null
          like_count?: number | null
          looking_for?: string[] | null
          match_count?: number | null
          not_comfortable_with?: string[] | null
          occupation?: string | null
          orientation?: Database["public"]["Enums"]["sexual_orientation"] | null
          pets?: string[] | null
          political_views?: string | null
          position?: string | null
          position_preferences?: string[] | null
          practices?: string[] | null
          privacy_settings?: PrivacySettings | null
          profile_picture_url?: string | null
          profile_quality_score?: number | null
          profile_slug?: string | null
          profile_views?: number | null
          relationship_status?: Database["public"]["Enums"]["relationship_status"] | null
          religion?: string | null
          response_rate?: number | null
          safeguards?: string[] | null
          school?: string | null
          smoking_status?: string | null
          sti_tested_date?: string | null
          subscription_tier?: SubscriptionTier | null
          user_role?: UserRole | null
          user_status?: UserStatus | null
          vaccination_status?: Json | null
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          verified_badges?: string[] | null
          video_urls?: string[] | null
          voice_intro_url?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
        }
        Relationships: []
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      relationship_status: "single" | "dating" | "married" | "open" | "polyamorous"
      sexual_orientation: "straight" | "gay" | "lesbian" | "bisexual" | "pansexual" | "queer" | "asexual"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      subscription_tier: SubscriptionTier
      trust_level: TrustLevel
      user_role: UserRole
      user_status: UserStatus
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    Functions: {
      get_nearby_places: {
        Args: {
          lat: number
          lng: number
          radius: number
        }
        Returns: {
          id: string
          name: string
          description: string
          category: string
          location: PostGISPoint
          distance: number
        }[]
      }
      get_nearby_stories: {
        Args: {
          lat: number
          lng: number
          radius: number
        }
        Returns: {
          id: string
          title: string
          content: string
          location: PostGISPoint
          distance: number
        }[]
      }
    }
  }
}

export interface PostGISPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs: {
    type: 'name';
    properties: {
      name: 'EPSG:4326';
    };
  };
}

export type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
