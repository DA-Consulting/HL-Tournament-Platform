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
      tournament_players: {
        Row: {
          id: string
          tournament_id: string
          player_id: string
          score: number
          matches_played: number
          matches_won: number
          matches_lost: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          player_id: string
          score?: number
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          player_id?: string
          score?: number
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      tournament_matches: {
        Row: {
          id: string
          tournament_id: string
          player1_id: string
          player2_id: string
          player1_score: number
          player2_score: number
          winner_player_id: string | null
          status: string
          map_name: string
          round_name: string | null
          played_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          player1_id: string
          player2_id: string
          player1_score?: number
          player2_score?: number
          winner_player_id?: string | null
          status?: string
          map_name?: string
          round_name?: string | null
          played_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          player1_id?: string
          player2_id?: string
          player1_score?: number
          player2_score?: number
          winner_player_id?: string | null
          status?: string
          map_name?: string
          round_name?: string | null
          played_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player1_id_fkey"
            columns: ["player1_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey"
            columns: ["player2_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_player_id_fkey"
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
