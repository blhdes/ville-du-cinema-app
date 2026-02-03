'use client'

import { useEffect, useState, useCallback } from 'react'
import localforage from 'localforage'
import { useUser } from './useUser'
import type { FollowedUser } from '@/types/database'

const LOCALFORAGE_KEY = 'followed_users'

interface UseUserListsReturn {
  users: FollowedUser[]
  usernames: string[]
  isLoading: boolean
  error: string | null
  addUser: (username: string) => Promise<{ success: boolean; error?: string }>
  removeUser: (username: string) => Promise<void>
  isAuthenticated: boolean
  clearError: () => void
}

// Convert legacy string[] to FollowedUser[]
function convertToFollowedUsers(data: string[] | FollowedUser[]): FollowedUser[] {
  if (!data || data.length === 0) return []

  // Check if it's already FollowedUser[]
  if (typeof data[0] === 'object' && 'username' in data[0]) {
    return data as FollowedUser[]
  }

  // Convert string[] to FollowedUser[]
  return (data as string[]).map((username) => ({
    username,
    added_at: new Date().toISOString(),
  }))
}

export function useUserLists(): UseUserListsReturn {
  const { user, isLoading: isAuthLoading } = useUser()
  const [users, setUsers] = useState<FollowedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // Load users on mount and when auth state changes
  useEffect(() => {
    if (isAuthLoading) return

    const loadUsers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (isAuthenticated) {
          // Load from API
          const response = await fetch('/api/lists')

          if (!response.ok) {
            if (response.status === 401) {
              // Session expired, treat as guest
              await loadFromLocalforage()
              return
            }
            throw new Error('Failed to fetch lists')
          }

          const data = await response.json()
          setUsers(data.followed_users || [])
        } else {
          // Load from localforage (guest mode)
          await loadFromLocalforage()
        }
      } catch (err) {
        console.error('Error loading users:', err)
        setError('Failed to load your list')
      } finally {
        setIsLoading(false)
      }
    }

    const loadFromLocalforage = async () => {
      const savedUsers = await localforage.getItem<string[] | FollowedUser[]>(
        LOCALFORAGE_KEY
      )
      if (savedUsers) {
        setUsers(convertToFollowedUsers(savedUsers))
      } else {
        setUsers([])
      }
    }

    loadUsers()
  }, [isAuthenticated, isAuthLoading])

  // Add user
  const addUser = useCallback(
    async (
      username: string
    ): Promise<{ success: boolean; error?: string }> => {
      const normalizedUsername = username.trim().toLowerCase()

      if (!normalizedUsername) {
        return { success: false, error: 'Username is required' }
      }

      // Check for duplicates locally first
      if (users.some((u) => u.username === normalizedUsername)) {
        return { success: false, error: 'User already in list' }
      }

      setError(null)

      try {
        if (isAuthenticated) {
          // Add via API
          const response = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: normalizedUsername }),
          })

          const data = await response.json()

          if (!response.ok) {
            return { success: false, error: data.error || 'Failed to add user' }
          }

          // Add to local state
          setUsers((prev) => [...prev, data.user])
          return { success: true }
        } else {
          // Guest mode - add to localforage
          const newUser: FollowedUser = {
            username: normalizedUsername,
            added_at: new Date().toISOString(),
          }

          const updatedUsers = [...users, newUser]
          setUsers(updatedUsers)

          // Save usernames to localforage (backward compatible)
          await localforage.setItem(
            LOCALFORAGE_KEY,
            updatedUsers.map((u) => u.username)
          )

          return { success: true }
        }
      } catch (err) {
        console.error('Error adding user:', err)
        const errorMsg = 'Failed to add user'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    },
    [isAuthenticated, users]
  )

  // Remove user
  const removeUser = useCallback(
    async (username: string): Promise<void> => {
      const normalizedUsername = username.trim().toLowerCase()
      setError(null)

      try {
        if (isAuthenticated) {
          // Remove via API
          const response = await fetch('/api/lists', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: normalizedUsername }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to remove user')
          }

          // Remove from local state
          setUsers((prev) =>
            prev.filter((u) => u.username !== normalizedUsername)
          )
        } else {
          // Guest mode - remove from localforage
          const updatedUsers = users.filter(
            (u) => u.username !== normalizedUsername
          )
          setUsers(updatedUsers)

          // Save usernames to localforage
          await localforage.setItem(
            LOCALFORAGE_KEY,
            updatedUsers.map((u) => u.username)
          )
        }
      } catch (err) {
        console.error('Error removing user:', err)
        setError('Failed to remove user')
      }
    },
    [isAuthenticated, users]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Extract usernames for backward compatibility
  const usernames = users.map((u) => u.username)

  return {
    users,
    usernames,
    isLoading: isLoading || isAuthLoading,
    error,
    addUser,
    removeUser,
    isAuthenticated,
    clearError,
  }
}
