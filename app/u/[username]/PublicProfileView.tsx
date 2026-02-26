'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft } from 'lucide-react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import FollowingList from '@/components/profile/FollowingList'
import type { PublicProfile } from '@/types/database'

interface PublicProfileViewProps {
  profile: PublicProfile
}

export default function PublicProfileView({ profile }: PublicProfileViewProps) {
  const t = useTranslations('profile')

  // Adapt PublicProfile to UserProfile shape for ProfileHeader
  const profileForHeader = {
    user_id: '',
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    display_name: profile.display_name,
    followed_users: profile.followed_users,
    language: 'en' as const,
    hide_userlist_main: false,
    feed_grid_columns: 1 as const,
    hide_watch_notifications: false,
    username: profile.username,
    updated_at: '',
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
          {t('backToHome')}
        </Link>

        {/* Display name + username */}
        <h1 className="text-3xl font-serif font-black uppercase tracking-tight mb-2">
          {profile.display_name || `@${profile.username}`}
        </h1>
        {profile.display_name && (
          <p className="text-sm font-serif text-sepia-dark mb-8">@{profile.username}</p>
        )}
        {!profile.display_name && <div className="mb-8" />}

        {/* Profile Header (avatar + bio) */}
        <ProfileHeader profile={profileForHeader} />

        {/* Divider */}
        <div className="border-t-4 border-black my-10" />

        {/* Following list */}
        <FollowingList users={profile.followed_users} />
      </div>
    </div>
  )
}
