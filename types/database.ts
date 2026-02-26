/**
 * Ville du Cinéma - Database Types
 * Supabase schema types and API request/response shapes.
 */

/** JSON-serialisable value — mirrors Supabase's generated Json type. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Supported UI locales. `fr` is the default. */
export type Locale = 'fr' | 'en' | 'es'

/**
 * A Letterboxd account that a user has chosen to follow.
 * Stored as a JSONB array in `user_data.followed_users`.
 */
export interface FollowedUser {
  username: string
  display_name?: string
  added_at: string // ISO 8601 timestamp
}

/**
 * Supabase database schema definition.
 * Used to type the Supabase client via `createClient<Database>()`.
 */
export interface Database {
  public: {
    Tables: {
      user_data: {
        /** Full row returned by SELECT queries. */
        Row: {
          user_id: string
          followed_users: FollowedUser[]
          language: Locale
          avatar_url: string | null
          bio: string
          display_name: string | null
          hide_userlist_main: boolean
          feed_grid_columns: 1 | 2 | 3
          hide_watch_notifications: boolean
          username: string | null
          updated_at: string // ISO 8601 timestamp
        }
        /** Shape accepted by INSERT statements. */
        Insert: {
          user_id: string
          followed_users?: FollowedUser[]
          language?: Locale
          avatar_url?: string | null
          bio?: string
          display_name?: string | null
          hide_userlist_main?: boolean
          feed_grid_columns?: 1 | 2 | 3
          hide_watch_notifications?: boolean
          username?: string | null
          updated_at?: string
        }
        /** Shape accepted by UPDATE statements (all fields optional). */
        Update: {
          user_id?: string
          followed_users?: FollowedUser[]
          language?: Locale
          avatar_url?: string | null
          bio?: string
          display_name?: string | null
          hide_userlist_main?: boolean
          feed_grid_columns?: 1 | 2 | 3
          hide_watch_notifications?: boolean
          username?: string | null
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

/** Full `user_data` row — convenience alias for the Row type. */
export type UserData = Database['public']['Tables']['user_data']['Row']
/** Insert shape for `user_data`. */
export type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
/** Update shape for `user_data`. */
export type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

/**
 * User display preferences stored in `user_data`.
 * Used by `useDisplayPreferences` and `/api/profile/display`.
 */
export interface DisplayPreferences {
  hide_userlist_main: boolean
  feed_grid_columns: 1 | 2 | 3
  hide_watch_notifications: boolean
}

/**
 * Full profile shape returned by `/api/profile`.
 * Combines identity, preferences, and followed-user list.
 */
export interface UserProfile {
  user_id: string
  avatar_url: string | null
  bio: string
  display_name: string | null
  followed_users: FollowedUser[]
  language: Locale
  hide_userlist_main: boolean
  feed_grid_columns: 1 | 2 | 3
  hide_watch_notifications: boolean
  username: string | null
  updated_at: string
}

/**
 * Public-safe subset of a user profile, returned by `/api/profile/public`.
 * Contains no private preferences or authentication details.
 */
export interface PublicProfile {
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string
  followed_users: FollowedUser[]
}

// ---------------------------------------------------------------------------
// API request types — used to type request bodies in API route handlers.
// ---------------------------------------------------------------------------

/** Body for POST `/api/lists` — adds a followed Letterboxd user. */
export interface AddUserRequest {
  username: string
  display_name?: string
}

/** Body for PUT `/api/lists` — updates a followed user's display name. */
export interface UpdateUserRequest {
  username: string
  display_name?: string
}

/** Body for DELETE `/api/lists` — removes a followed user. */
export interface DeleteUserRequest {
  username: string
}

/** Body for POST `/api/lists/reorder` — sets the display order of followed users. */
export interface ReorderRequest {
  order: string[]
}
