'use client'

import { useTranslations } from 'next-intl'
import Toggle from '@/components/ui/Toggle'
import ColumnSelector from '@/components/ui/ColumnSelector'

interface DisplayPreferences {
  hideUserlistMain: boolean
  feedGridColumns: 1 | 2 | 3
  hideWatchNotifications: boolean
}

interface DisplaySettingsProps {
  preferences: DisplayPreferences
  onSetHideUserlistMain: (value: boolean) => Promise<void>
  onSetFeedGridColumns: (value: 1 | 2 | 3) => Promise<void>
  onSetHideWatchNotifications: (value: boolean) => Promise<void>
  isLoading: boolean
}

export default function DisplaySettings({
  preferences,
  onSetHideUserlistMain,
  onSetFeedGridColumns,
  onSetHideWatchNotifications,
  isLoading,
}: DisplaySettingsProps) {
  const t = useTranslations('profile')

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-foreground/10 border-2 border-foreground/20" />
        <div className="h-16 bg-foreground/10 border-2 border-foreground/20" />
        <div className="h-16 bg-foreground/10 border-2 border-foreground/20" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hide User List */}
      <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
        <div>
          <p className="font-serif font-bold text-sm">{t('hideUserList')}</p>
          <p className="text-xs text-sepia-dark mt-0.5">{t('hideUserListDesc')}</p>
        </div>
        <Toggle
          checked={preferences.hideUserlistMain}
          onChange={onSetHideUserlistMain}
        />
      </div>

      {/* Feed Layout */}
      <div className="p-4 bg-white border-2 border-black">
        <p className="font-serif font-bold text-sm mb-3">{t('feedLayout')}</p>
        <ColumnSelector
          value={preferences.feedGridColumns}
          onChange={onSetFeedGridColumns}
          threeColumnsDisabled={!preferences.hideUserlistMain}
          labels={{
            col1: t('columns1'),
            col2: t('columns2'),
            col3: t('columns3'),
          }}
        />
        {!preferences.hideUserlistMain && (
          <p className="text-xs text-sepia-dark mt-2 italic">
            * {t('columns3Disabled')}
          </p>
        )}
      </div>

      {/* Hide Watch Notifications */}
      <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
        <div>
          <p className="font-serif font-bold text-sm">{t('hideWatchNotifications')}</p>
          <p className="text-xs text-sepia-dark mt-0.5">{t('hideWatchNotificationsDesc')}</p>
        </div>
        <Toggle
          checked={preferences.hideWatchNotifications}
          onChange={onSetHideWatchNotifications}
        />
      </div>
    </div>
  )
}
