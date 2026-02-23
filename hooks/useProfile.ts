'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from './useUser'
import type { UserProfile, DisplayPreferences } from '@/types/database'

interface UseProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  updateProfile: (data: { bio?: string; display_name?: string }) => Promise<void>
  updateDisplayPreferences: (data: Partial<DisplayPreferences>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  setAvatarUrl: (url: string) => Promise<void>
  removeAvatar: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile when user changes
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/profile')
      if (res.status === 401) {
        setError('Session expired')
        setProfile(null)
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await res.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!isUserLoading) {
      fetchProfile()
    }
  }, [user, isUserLoading, fetchProfile])

  // Update profile (bio, display_name, username)
  const updateProfile = useCallback(
    async (data: { bio?: string; display_name?: string; username?: string }) => {
      setError(null)

      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (res.status === 401) {
          setError('Session expired')
          return
        }

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to update profile')
        }

        const responseData = await res.json()
        setProfile(responseData.profile)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile'
        setError(message)
        throw err
      }
    },
    []
  )

  // Update display preferences
  const updateDisplayPreferences = useCallback(
    async (data: Partial<DisplayPreferences>) => {
      setError(null)

      try {
        const res = await fetch('/api/profile/display', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (res.status === 401) {
          setError('Session expired')
          return
        }

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to update display preferences')
        }

        const responseData = await res.json()
        setProfile((prev) =>
          prev ? { ...prev, ...responseData.preferences } : null
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update display preferences'
        setError(message)
        throw err
      }
    },
    []
  )

  // Upload avatar file
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    setError(null)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 401) {
        setError('Session expired')
        throw new Error('Session expired')
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to upload avatar')
      }

      const data = await res.json()
      setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : null))
      return data.avatar_url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar'
      setError(message)
      throw err
    }
  }, [])

  // Set avatar URL directly (for external URLs)
  const setAvatarUrl = useCallback(async (url: string) => {
    setError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      })

      if (res.status === 401) {
        setError('Session expired')
        return
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to set avatar URL')
      }

      const data = await res.json()
      setProfile(data.profile)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set avatar URL'
      setError(message)
      throw err
    }
  }, [])

  // Remove avatar
  const removeAvatar = useCallback(async () => {
    setError(null)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (res.status === 401) {
        setError('Session expired')
        return
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to remove avatar')
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove avatar'
      setError(message)
      throw err
    }
  }, [])

  return {
    profile,
    isLoading: isLoading || isUserLoading,
    error,
    updateProfile,
    updateDisplayPreferences,
    uploadAvatar,
    setAvatarUrl,
    removeAvatar,
  }
}
