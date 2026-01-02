export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'team';
          subscription_status: 'active' | 'canceled' | 'past_due' | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          subscription_status?: 'active' | 'canceled' | 'past_due' | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          subscription_status?: 'active' | 'canceled' | 'past_due' | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
      };
      experts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          essence: string;
          avatar_url: string | null;
          introduction: string;
          role: string | null;
          is_legend: boolean;
          stats: Json;
          core_beliefs: string[];
          aesthetics: Json;
          expertise_map: Json;
          thinking: Json;
          personality: Json;
          sidebar: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          essence: string;
          avatar_url?: string | null;
          introduction: string;
          role?: string | null;
          is_legend?: boolean;
          stats: Json;
          core_beliefs: string[];
          aesthetics: Json;
          expertise_map: Json;
          thinking: Json;
          personality: Json;
          sidebar: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          essence?: string;
          avatar_url?: string | null;
          introduction?: string;
          role?: string | null;
          is_legend?: boolean;
          stats?: Json;
          core_beliefs?: string[];
          aesthetics?: Json;
          expertise_map?: Json;
          thinking?: Json;
          personality?: Json;
          sidebar?: Json;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'business' | 'project' | 'hypothetical' | 'debate';
          industry: string | null;
          description: string;
          needs: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'business' | 'project' | 'hypothetical' | 'debate';
          industry?: string | null;
          description: string;
          needs: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'business' | 'project' | 'hypothetical' | 'debate';
          industry?: string | null;
          description?: string;
          needs?: string[];
          updated_at?: string;
        };
      };
      team_structures: {
        Row: {
          id: string;
          team_id: string;
          nodes: Json;
          edges: Json;
          rationale: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          nodes: Json;
          edges: Json;
          rationale: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nodes?: Json;
          edges?: Json;
          rationale?: string[];
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
