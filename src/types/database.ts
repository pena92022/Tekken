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
      characters: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      frame_data: {
        Row: {
          id: string
          character_id: string
          move_name: string
          notation: string
          damage: number
          startup_frames: number
          active_frames: number
          recovery_frames: number
          on_block: number
          on_hit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          character_id: string
          move_name: string
          notation: string
          damage: number
          startup_frames: number
          active_frames: number
          recovery_frames: number
          on_block: number
          on_hit: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          move_name?: string
          notation?: string
          damage?: number
          startup_frames?: number
          active_frames?: number
          recovery_frames?: number
          on_block?: number
          on_hit?: number
          created_at?: string
          updated_at?: string
        }
      }
      matchups: {
        Row: {
          id: string
          player_character_id: string
          opponent_character_id: string
          difficulty: number
          strategies: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_character_id: string
          opponent_character_id: string
          difficulty?: number
          strategies?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_character_id?: string
          opponent_character_id?: string
          difficulty?: number
          strategies?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          credits: number
          tier: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          credits?: number
          tier?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          credits?: number
          tier?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      analysis_history: {
        Row: {
          id: string
          user_id: string
          player_character: string
          opponent_character: string
          stage: string | null
          game_mode: string
          analysis: Json
          tokens_used: number
          credits_used: number
          model_used: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          player_character: string
          opponent_character: string
          stage?: string | null
          game_mode?: string
          analysis: Json
          tokens_used: number
          credits_used: number
          model_used: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          player_character?: string
          opponent_character?: string
          stage?: string | null
          game_mode?: string
          analysis?: Json
          tokens_used?: number
          credits_used?: number
          model_used?: string
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: string
          stripe_payment_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: string
          stripe_payment_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: string
          stripe_payment_id?: string | null
          description?: string
          created_at?: string
        }
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