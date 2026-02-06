'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { User, LogOut, ChevronDown } from 'lucide-react'

export default function AuthButton() {
  const t = useTranslations('auth')
  const { user, isLoading, signOut } = useUser()
  const { profile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  // Get user initials for fallback avatar
  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Loading state - show nothing to avoid layout shift
  if (isLoading) {
    return (
      <div className="w-20 h-8 bg-foreground/5 animate-pulse" />
    )
  }

  // Not authenticated - show subtle sign in link
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors px-3 py-2 border border-foreground/10 hover:border-foreground/30"
      >
        <User size={14} />
        <span className="hidden sm:inline">{t('login')}</span>
      </Link>
    )
  }

  // Authenticated - show user dropdown
  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark transition-colors px-3 py-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-8 h-8 rounded-full border border-foreground object-cover"
          />
        ) : (
          <span className="w-8 h-8 bg-[#FFD600] text-sm font-bold flex items-center justify-center rounded-full border border-foreground">
            {getInitials()}
          </span>
        )}
        <span className="hidden sm:inline max-w-24 truncate">
          {profile?.display_name || user.email?.split('@')[0]}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-56 bg-background border-2 border-foreground shadow-lg overflow-hidden transition-all duration-200 origin-top z-50 ${
          isOpen
            ? 'opacity-100 scale-y-100 pointer-events-auto'
            : 'opacity-0 scale-y-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'top' }}
      >
        {/* Email display */}
        <div className="px-4 py-3 border-b border-foreground/10">
          <p className="text-xs text-sepia-dark truncate font-serif">
            {user.email}
          </p>
        </div>

        {/* My Profile link */}
        <Link
          href="/profile"
          onClick={() => setIsOpen(false)}
          className="w-full text-left px-4 py-3 text-xs font-serif uppercase tracking-widest flex items-center gap-3 hover:bg-foreground/5 text-sepia-dark hover:text-foreground transition-colors border-b border-foreground/10"
        >
          <User size={14} />
          <span>{t('myProfile')}</span>
        </Link>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-3 text-xs font-serif uppercase tracking-widest flex items-center gap-3 hover:bg-foreground/5 text-sepia-dark hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  )
}
