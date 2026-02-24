'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowLeft, UserX } from 'lucide-react'

export default function PublicProfileNotFound() {
  const t = useTranslations('profile')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <UserX size={64} className="mx-auto mb-6 text-sepia-dark/50" />
        <h1 className="text-3xl font-serif font-black uppercase tracking-tight mb-4">
          {t('profileNotFound')}
        </h1>
        <p className="text-sm font-serif text-sepia-dark mb-8">
          {t('profileNotFoundDesc')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD600] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-serif uppercase tracking-widest font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <ArrowLeft size={16} />
          {t('backToHome')}
        </Link>
      </div>
    </div>
  )
}
