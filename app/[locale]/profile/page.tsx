'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import NextLink from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { Settings, Share2, ArrowLeft, Check, ExternalLink } from 'lucide-react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import FollowingList from '@/components/profile/FollowingList'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const { user, isLoading: isUserLoading } = useUser()
  const { profile, isLoading: isProfileLoading } = useProfile()
  const [copied, setCopied] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const handleShare = async () => {
    if (!profile?.username) return
    const url = `${window.location.origin}/u/${profile.username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Loading state
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-8">
            <div className="flex gap-6">
              <div className="w-[120px] h-[120px] bg-foreground/10 border-4 border-foreground/20" />
              <div className="flex-1 h-[120px] bg-foreground/10 border-4 border-foreground/20" />
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-40 bg-foreground/10" />
              <div className="h-12 w-32 bg-foreground/10" />
            </div>
            <div className="h-8 w-48 bg-foreground/10" />
            <div className="h-64 bg-foreground/10 border-4 border-foreground/20" />
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - will redirect, show nothing
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          Back
        </Link>

        {/* Page title */}
        <h1 className="text-3xl font-serif font-black uppercase tracking-tight mb-8">
          {t('title')}
        </h1>

        {/* Profile Header (avatar + bio) */}
        <ProfileHeader profile={profile} />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mt-6 mb-10">
          <Link
            href="/profile/settings"
            className="flex items-center gap-2 px-6 py-3 bg-[#FFD600] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-serif uppercase tracking-widest font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Settings size={16} />
            {t('editProfile')}
          </Link>

          {profile?.username ? (
            <>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-foreground/5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    {t('linkCopied')}
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    {t('share')}
                  </>
                )}
              </button>
              <NextLink
                href={`/u/${profile.username}`}
                className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-foreground/5 transition-colors"
              >
                <ExternalLink size={16} />
                {t('viewPublicProfile')}
              </NextLink>
            </>
          ) : (
            <Link
              href="/profile/settings"
              className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-foreground/5 transition-colors text-sepia-dark"
            >
              <Share2 size={16} />
              {t('publicProfilePrompt')}
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="border-t-4 border-black mb-10" />

        {/* Following list */}
        <FollowingList users={profile?.followed_users || []} />
      </div>
    </div>
  )
}
