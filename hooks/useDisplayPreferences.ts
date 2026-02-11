'use client'

import { useCallback, useState, useEffect } from 'react'
import { useProfile } from './useProfile'

interface DisplayPreferences {
  hideUserlistMain: boolean
  feedGridColumns: 1 | 2 | 3
  hideWatchNotifications: boolean
}

interface UseDisplayPreferencesReturn {
  preferences: DisplayPreferences
  isLoading: boolean
  isAuthenticated: boolean
  setHideUserlistMain: (value: boolean) => Promise<void>
  setFeedGridColumns: (value: 1 | 2 | 3) => Promise<void>
  setHideWatchNotifications: (value: boolean) => Promise<void>
  updatePreferences: (prefs: Partial<DisplayPreferences>) => Promise<void>
}

const DEFAULTS: DisplayPreferences = {
  hideUserlistMain: false,
  feedGridColumns: 1,
  hideWatchNotifications: false,
}

export function useDisplayPreferences(): UseDisplayPreferencesReturn {
  const { profile, isLoading, updateDisplayPreferences } = useProfile()
  const isAuthenticated = !!profile

  // Local state for optimistic updates
  const [localPrefs, setLocalPrefs] = useState<DisplayPreferences>(DEFAULTS)

  // Sync local state from profile when it loads/changes
  useEffect(() => {
    if (profile) {
      setLocalPrefs({
        hideUserlistMain: profile.hide_userlist_main,
        feedGridColumns: profile.feed_grid_columns,
        hideWatchNotifications: profile.hide_watch_notifications,
      })
    }
  }, [profile])

  const updatePreferences = useCallback(
    async (prefs: Partial<DisplayPreferences>) => {
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
    setHideUserlistMain,
    setFeedGridColumns,
    setHideWatchNotifications,
    updatePreferences,
  }
}
