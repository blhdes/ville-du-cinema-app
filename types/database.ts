/**
 * Ville du Cinéma - Database Types
 * Generated types for Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Locale = 'fr' | 'en' | 'es'

// FollowedUser type for JSONB array
export interface FollowedUser {
  username: string
  display_name?: string
  added_at: string // ISO 8601 timestamp
}

export interface Database {
  public: {
    Tables: {
      user_data: {
        Row: {
          user_id: string
          followed_users: FollowedUser[]
          language: Locale
          updated_at: string // ISO 8601 timestamp
        }
        Insert: {
          user_id: string
          followed_users?: FollowedUser[]
          language?: Locale
          updated_at?: string
        }
        Update: {
          user_id?: string
          followed_users?: FollowedUser[]
          language?: Locale
          updated_at?: string
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
  }
}

// Utility type for easier access
export type UserData = Database['public']['Tables']['user_data']['Row']
export type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
export type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

// API Request/Response types
export interface AddUserRequest {
  username: string
  display_name?: string
}

export interface UpdateUserRequest {
  username: string
  display_name?: string
}

export interface DeleteUserRequest {
  username: string
}

export interface ReorderRequest {
  order: string[]
}

export interface ListsResponse {
  followed_users: FollowedUser[]
}

export interface UserResponse {
  user: FollowedUser
}

export interface SuccessResponse {
  success: boolean
}

export interface ErrorResponse {
  error: string
}
