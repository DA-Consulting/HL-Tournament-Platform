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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clans: {
        Row: {
          id: string
          name: string
          owner_id: string
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          user_id: string | null
          name: string
          steam_id: string | null
          avatar_url: string | null
          clan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          steam_id?: string | null
          avatar_url?: string | null
          clan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          steam_id?: string | null
          avatar_url?: string | null
          clan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_clan_id_fkey"
            columns: ["clan_id"]
            referencedRelation: "clans"
            referencedColumns: ["id"]
          }
        ]
      }
      tournaments: {
        Row: {
          id: string
          title: string
          description: string | null
          player_id: string
          status: string
          start_date: string
          end_date: string | null
          prize_pool_currency: string | null
          prize_pool_amount: number | null
          winner_player_id: string | null
          tournament_type: string
          banner_url: string | null
          game_mode: string | null
          max_participants: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          player_id: string
          status?: string
          start_date: string
          end_date?: string | null
          prize_pool_currency?: string | null
          prize_pool_amount?: number | null
          winner_player_id?: string | null
          tournament_type?: string
          banner_url?: string | null
          game_mode?: string | null
          max_participants?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          player_id?: string
          status?: string
          start_date?: string
          end_date?: string | null
          prize_pool_currency?: string | null
          prize_pool_amount?: number | null
          winner_player_id?: string | null
          tournament_type?: string
          banner_url?: string | null
          game_mode?: string | null
          max_participants?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_winner_player_id_fkey"
            columns: ["winner_player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
