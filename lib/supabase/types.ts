import { Database } from './database.types'

// Profile types
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Session types  
export type SessionRow = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

// Application types
export interface UserProfile extends Omit<ProfileRow, 'wallet_address'> {
  // Make wallet_address required in our app
  wallet_address: string
}

export type UserSession = SessionRow

export interface Web3Signature {
  message: string
  signature: string
}

export interface AuthState {
  user: UserProfile | null
  session: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Preferences type for better type safety
export interface UserPreferences {
  currency: string
  language: string
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
}

// For creating new profiles
export interface CreateProfileData {
  username: string
  wallet_address: string
  display_name?: string
  avatar_url?: string
  bio?: string
  is_temporary?: boolean
}