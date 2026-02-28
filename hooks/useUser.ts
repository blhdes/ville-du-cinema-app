'use client'

import { useEffect, useState } from 'react'
import auth from '@/lib/auth'
import type { User } from '@/lib/auth'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    auth.getUser().then((user) => {
      setUser(user)
      setIsLoading(false)
    })

    const unsubscribe = auth.onAuthStateChange((user) => {
      setUser(user)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signOut = async () => {
    await auth.signOut()
    setUser(null)
  }

  return { user, isLoading, signOut }
}
