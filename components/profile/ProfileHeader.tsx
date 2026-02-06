'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Camera } from 'lucide-react'
import type { UserProfile } from '@/types/database'

interface ProfileHeaderProps {
  profile: UserProfile | null
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const t = useTranslations('profile')

  return (
    <div className="flex gap-6">
      {/* Avatar - Square, brutalist style */}
      <div className="flex-shrink-0">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Avatar"
            width={120}
            height={120}
            className="w-[120px] h-[120px] border-4 border-black object-cover"
          />
        ) : (
          <div className="w-[120px] h-[120px] border-4 border-black bg-[#f4efdf] flex items-center justify-center">
            <Camera size={40} className="text-sepia-dark/50" />
          </div>
        )}
      </div>

      {/* Bio container */}
      <div className="flex-1 bg-[#f4efdf] border-4 border-black p-4 min-h-[120px]">
        <h3 className="text-xs font-serif uppercase tracking-widest text-sepia-dark mb-2">
          {t('bio')}
        </h3>
        {profile?.bio ? (
          <p className="text-sm font-serif text-foreground leading-relaxed">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm font-serif text-sepia-dark/60 italic">
            {t('noBio')}
          </p>
        )}
      </div>
    </div>
  )
}
