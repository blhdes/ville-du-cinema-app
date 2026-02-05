'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useUser } from '@/hooks/useUser'
import { User, LogOut, ChevronDown, Dices } from 'lucide-react'
import { CINEMA_AVATARS, AVATAR_COUNT } from '@/constants/avatars'

export default function AuthButton() {
  const t = useTranslations('auth')
  const { user, isLoading, signOut, avatarIndex, setAvatar } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsAvatarSelectorOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    setIsAvatarSelectorOpen(false)
  }

  const handleAvatarSelect = async (index: number) => {
    await setAvatar(index)
    setIsAvatarSelectorOpen(false)
  }

  const handleRandomAvatar = async () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_COUNT)
    await setAvatar(randomIndex)
    setIsAvatarSelectorOpen(false)
  }

  const currentAvatar = CINEMA_AVATARS[avatarIndex] || CINEMA_AVATARS[0]

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
        {/* Avatar emoji */}
        <span className="w-8 h-8 bg-[#FFD600] text-lg flex items-center justify-center rounded-full border border-foreground">
          {currentAvatar.emoji}
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

        {/* Avatar selector section */}
        <div className="border-b border-foreground/10">
          <button
            onClick={() => setIsAvatarSelectorOpen(!isAvatarSelectorOpen)}
            className="w-full text-left px-4 py-3 text-xs font-serif uppercase tracking-widest flex items-center justify-between hover:bg-foreground/5 text-sepia-dark hover:text-foreground transition-colors"
          >
            <span>{t('changeAvatar')}</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${isAvatarSelectorOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Avatar grid */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isAvatarSelectorOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-2 mb-2">
                {CINEMA_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`w-10 h-10 text-lg flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 ${
                      avatarIndex === avatar.id
                        ? 'bg-[#FFD600] border-foreground'
                        : 'bg-foreground/5 border-foreground/20 hover:border-foreground/50'
                    }`}
                    title={avatar.label}
                  >
                    {avatar.emoji}
                  </button>
                ))}
              </div>
              {/* Random button */}
              <button
                onClick={handleRandomAvatar}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-serif uppercase tracking-widest bg-foreground/5 hover:bg-foreground/10 border border-foreground/20 hover:border-foreground/40 transition-colors"
              >
                <Dices size={14} />
                <span>{t('randomAvatar')}</span>
              </button>
            </div>
          </div>
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
