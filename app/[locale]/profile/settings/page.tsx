'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { useDisplayPreferences } from '@/hooks/useDisplayPreferences'
import { ArrowLeft, Check } from 'lucide-react'
import AvatarUploader from '@/components/profile/AvatarUploader'
import BioEditor from '@/components/profile/BioEditor'
import DisplaySettings from '@/components/settings/DisplaySettings'
import UserList from '@/components/UserList'

export default function ProfileSettingsPage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const { user, isLoading: isUserLoading } = useUser()
  const { profile, isLoading: isProfileLoading, updateProfile, uploadAvatar, setAvatarUrl, removeAvatar } = useProfile()
  const {
    preferences,
    isLoading: isPrefsLoading,
    setHideUserlistMain,
    setFeedGridColumns,
    setHideWatchNotifications,
  } = useDisplayPreferences()

  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const handleUploadAvatar = async (file: File): Promise<string> => {
    const url = await uploadAvatar(file)
    showSavedFeedback()
    return url
  }

  const handleSetAvatarUrl = async (url: string) => {
    await setAvatarUrl(url)
    showSavedFeedback()
  }

  const handleRemoveAvatar = async () => {
    await removeAvatar()
    showSavedFeedback()
  }

  const handleSaveBio = async (bio: string) => {
    setIsSaving(true)
    try {
      await updateProfile({ bio })
      showSavedFeedback()
    } finally {
      setIsSaving(false)
    }
  }

  const showSavedFeedback = () => {
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  // Loading state
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-6 w-32 bg-foreground/10" />
            <div className="h-10 w-64 bg-foreground/10" />
            <div className="h-48 bg-foreground/10 border-4 border-foreground/20" />
            <div className="h-48 bg-foreground/10 border-4 border-foreground/20" />
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          {t('backToProfile')}
        </Link>

        {/* Page title */}
        <h1 className="text-3xl font-serif font-black uppercase tracking-tight mb-8">
          {t('settings')}
        </h1>

        {/* Success feedback */}
        {showSaved && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-black border-2 border-[#FFD600] shadow-[4px_4px_0px_0px_rgba(255,214,0,1)] animate-[slideDown_0.3s_ease-out]">
            <Check size={16} className="text-[#FFD600]" />
            <span className="text-white font-serif text-sm font-bold">{t('saved')}</span>
          </div>
        )}

        {/* Profile Picture Section */}
        <section className="mb-10">
          <div className="bg-black text-[#FFD600] px-4 py-2 font-serif font-bold uppercase tracking-widest mb-6">
            {t('profilePicture')}
          </div>
          <AvatarUploader
            currentAvatarUrl={profile?.avatar_url || null}
            onUpload={handleUploadAvatar}
            onSetUrl={handleSetAvatarUrl}
            onRemove={handleRemoveAvatar}
          />
        </section>

        {/* Bio Section */}
        <section className="mb-10">
          <div className="bg-black text-[#FFD600] px-4 py-2 font-serif font-bold uppercase tracking-widest mb-6">
            {t('bioLabel')}
          </div>
          <BioEditor
            currentBio={profile?.bio || ''}
            onSave={handleSaveBio}
            isSaving={isSaving}
          />
        </section>

        {/* Display Settings Section */}
        <section className="mb-10">
          <div className="bg-black text-[#FFD600] px-4 py-2 font-serif font-bold uppercase tracking-widest mb-6">
            {t('displaySettings')}
          </div>
          <DisplaySettings
            preferences={preferences}
            onSetHideUserlistMain={setHideUserlistMain}
            onSetFeedGridColumns={setFeedGridColumns}
            onSetHideWatchNotifications={setHideWatchNotifications}
            isLoading={isPrefsLoading}
          />
        </section>

        {/* Manage Following - shown when UserList is hidden from main */}
        {preferences.hideUserlistMain ? (
          <section>
            <div className="bg-black text-[#FFD600] px-4 py-2 font-serif font-bold uppercase tracking-widest mb-6">
              {t('manageFollowing')}
            </div>
            <UserList onUsersChange={() => {}} />
          </section>
        ) : (
          <div className="p-4 bg-[#f4efdf] border-2 border-black">
            <p className="text-sm font-serif">{t('userListOnMain')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
