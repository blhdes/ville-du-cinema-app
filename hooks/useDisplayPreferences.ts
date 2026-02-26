'use client'

import { useCallback, useState, useEffect } from 'react'
import { useProfile } from './useProfile'

// Camelcase view of display preferences — the hook's public API for React consumers.
// Distinct from DisplayPreferences in types/database.ts, which uses snake_case for the DB/API layer.
interface DisplayPrefs {
  hideUserlistMain: boolean
  feedGridColumns: 1 | 2 | 3
  hideWatchNotifications: boolean
}

interface UseDisplayPreferencesReturn {
  preferences: DisplayPrefs
  isLoading: boolean
  isAuthenticated: boolean
  profile: import('@/types/database').UserProfile | null
  setHideUserlistMain: (value: boolean) => Promise<void>
  setFeedGridColumns: (value: 1 | 2 | 3) => Promise<void>
  setHideWatchNotifications: (value: boolean) => Promise<void>
  updatePreferences: (prefs: Partial<DisplayPrefs>) => Promise<void>
}

const DEFAULTS: DisplayPrefs = {
  hideUserlistMain: false,
  feedGridColumns: 1,
  hideWatchNotifications: false,
}

export function useDisplayPreferences(): UseDisplayPreferencesReturn {
  const { profile, isLoading, updateDisplayPreferences } = useProfile()
  const isAuthenticated = !!profile

  // Local state for optimistic updates
  const [localPrefs, setLocalPrefs] = useState<DisplayPrefs>(DEFAULTS)

  // Sync local state from profile when it loads/changes, reset on logout
  useEffect(() => {
    if (profile) {
      setLocalPrefs({
        hideUserlistMain: profile.hide_userlist_main,
        feedGridColumns: profile.feed_grid_columns,
        hideWatchNotifications: profile.hide_watch_notifications,
      })
    } else {
      setLocalPrefs(DEFAULTS)
    }
  }, [profile])

  const updatePreferences = useCallback(
    async (prefs: Partial<DisplayPrefs>) => {
      if (!isAuthenticated) return

      // Optimistic update
      setLocalPrefs((prev) => ({ ...prev, ...prefs }))

      // Map camelCase to snake_case for API
      const apiData: Record<string, unknown> = {}
      if (prefs.hideUserlistMain !== undefined) {
        apiData.hide_userlist_main = prefs.hideUserlistMain
      }
      if (prefs.feedGridColumns !== undefined) {
        apiData.feed_grid_columns = prefs.feedGridColumns
      }
      if (prefs.hideWatchNotifications !== undefined) {
        apiData.hide_watch_notifications = prefs.hideWatchNotifications
      }

      try {
        await updateDisplayPreferences(apiData)
      } catch {
        // Revert on failure - sync back from profile
        if (profile) {
          setLocalPrefs({
            hideUserlistMain: profile.hide_userlist_main,
            feedGridColumns: profile.feed_grid_columns,
            hideWatchNotifications: profile.hide_watch_notifications,
          })
        }
      }
    },
    [isAuthenticated, updateDisplayPreferences, profile]
  )

  const setHideUserlistMain = useCallback(
    async (value: boolean) => {
      if (!isAuthenticated) return

      // Showing UserList again and had 3 columns → drop to 2
      if (!value && localPrefs.feedGridColumns === 3) {
        await updatePreferences({
          hideUserlistMain: false,
          feedGridColumns: 2,
        })
        return
      }

      await updatePreferences({ hideUserlistMain: value })
    },
    [isAuthenticated, localPrefs.feedGridColumns, updatePreferences]
  )

  const setFeedGridColumns = useCallback(
    async (value: 1 | 2 | 3) => {
      if (!isAuthenticated) return

      // 3 columns only when UserList is hidden
      if (value === 3 && !localPrefs.hideUserlistMain) {
        return
      }

      await updatePreferences({ feedGridColumns: value })
    },
    [isAuthenticated, localPrefs.hideUserlistMain, updatePreferences]
  )

  const setHideWatchNotifications = useCallback(
    async (value: boolean) => {
      if (!isAuthenticated) return
      await updatePreferences({ hideWatchNotifications: value })
    },
    [isAuthenticated, updatePreferences]
  )

  return {
    preferences: localPrefs,
    isLoading,
    isAuthenticated,
    profile,
    setHideUserlistMain,
    setFeedGridColumns,
    setHideWatchNotifications,
    updatePreferences,
  }
}
