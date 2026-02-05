'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarIndex, setAvatarIndex] = useState(0)

  // Fetch avatar when user changes
  const fetchAvatar = useCallback(async () => {
    if (!user) {
      setAvatarIndex(0)
      return
    }

    try {
      const res = await fetch('/api/user/avatar')
      if (res.ok) {
        const data = await res.json()
        setAvatarIndex(data.avatar_index ?? 0)
      }
    } catch {
      // Keep default avatar on error
    }
  }, [user])

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch avatar when user is set
  useEffect(() => {
    if (user) {
      fetchAvatar()
    }
  }, [user, fetchAvatar])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setAvatarIndex(0)
  }

  const setAvatar = async (index: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_index: index }),
      })

      if (res.ok) {
        setAvatarIndex(index)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return { user, isLoading, signOut, avatarIndex, setAvatar }
}
