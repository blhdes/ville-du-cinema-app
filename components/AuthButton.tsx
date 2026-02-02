'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useUser } from '@/hooks/useUser'
import { User, LogOut, ChevronDown } from 'lucide-react'

export default function AuthButton() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const { user, isLoading, signOut } = useUser()
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

  // Get user initials for avatar
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
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
        className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors px-3 py-2 border border-foreground/10 hover:border-foreground/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User initials avatar */}
        <span className="w-5 h-5 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
          {getInitials(user.email || 'U')}
        </span>
        <span className="hidden sm:inline max-w-24 truncate">
          {user.email?.split('@')[0]}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-48 bg-background border-2 border-foreground shadow-lg overflow-hidden transition-all duration-200 origin-top z-50 ${
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
