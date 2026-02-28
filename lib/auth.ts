import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type { User }

type Unsubscribe = () => void

export interface AuthClient {
  getUser(): Promise<User | null>
  onAuthStateChange(callback: (user: User | null) => void): Unsubscribe
  signOut(): Promise<void>
}

const auth: AuthClient = {
  async getUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  onAuthStateChange(callback) {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => callback(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  },
  async signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
  },
}

export default auth
