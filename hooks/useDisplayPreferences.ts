'use client'

import { useCallback, useMemo } from 'react'
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

  const preferences: DisplayPreferences = useMemo(() => {
    if (!profile) return DEFAULTS
    return {
      hideUserlistMain: profile.hide_userlist_main,
      feedGridColumns: profile.feed_grid_columns,
      hideWatchNotifications: profile.hide_watch_notifications,
    }
  }, [profile])

  const updatePreferences = useCallback(
    async (prefs: Partial<DisplayPreferences>) => {
      if (!isAuthenticated) return

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

      await updateDisplayPreferences(apiData)
    },
    [isAuthenticated, updateDisplayPreferences]
  )

  const setHideUserlistMain = useCallback(
    async (value: boolean) => {
      if (!isAuthenticated) return

      // Showing UserList again and had 3 columns → drop to 2
      if (!value && preferences.feedGridColumns === 3) {
        await updatePreferences({
          hideUserlistMain: false,
          feedGridColumns: 2,
        })
        return
      }

      await updatePreferences({ hideUserlistMain: value })
    },
    [isAuthenticated, preferences.feedGridColumns, updatePreferences]
  )

  const setFeedGridColumns = useCallback(
    async (value: 1 | 2 | 3) => {
      if (!isAuthenticated) return

      // 3 columns only when UserList is hidden
      if (value === 3 && !preferences.hideUserlistMain) {
        console.warn('3 columns only available when UserList is hidden')
        return
      }

      await updatePreferences({ feedGridColumns: value })
    },
    [isAuthenticated, preferences.hideUserlistMain, updatePreferences]
  )

  const setHideWatchNotifications = useCallback(
    async (value: boolean) => {
      if (!isAuthenticated) return
      await updatePreferences({ hideWatchNotifications: value })
    },
    [isAuthenticated, updatePreferences]
  )

  return {
    preferences,
    isLoading,
    isAuthenticated,
    setHideUserlistMain,
    setFeedGridColumns,
    setHideWatchNotifications,
    updatePreferences,
  }
}
