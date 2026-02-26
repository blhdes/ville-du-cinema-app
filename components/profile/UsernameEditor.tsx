'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X, Loader2, AlertTriangle } from 'lucide-react'

interface UsernameEditorProps {
  currentUsername: string | null
  onSave: (username: string) => Promise<void>
  isSaving: boolean
}

const USERNAME_REGEX = /^[a-z][a-z0-9-]{2,29}$/

export default function UsernameEditor({ currentUsername, onSave, isSaving }: UsernameEditorProps) {
  const t = useTranslations('profile')
  const [username, setUsername] = useState(currentUsername ?? '')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setUsername(currentUsername ?? '')
  }, [currentUsername])

  const checkAvailability = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setAvailable(null)
      setError('usernameInvalid')
      setChecking(false)
      return
    }

    // No need to check if same as current
    if (value === currentUsername) {
      setAvailable(null)
      setError(null)
      setChecking(false)
      return
    }

    setChecking(true)
    setError(null)

    try {
      const res = await fetch(`/api/profile/check-username?username=${value}`)
      const data = await res.json()

      if (data.error === 'reserved') {
        setAvailable(false)
        setError('usernameReserved')
      } else if (data.error === 'invalid') {
        setAvailable(false)
        setError('usernameInvalid')
      } else {
        setAvailable(data.available)
        setError(data.available ? null : 'usernameTaken')
      }
    } catch {
      setAvailable(null)
      setError(null)
    } finally {
      setChecking(false)
    }
  }, [currentUsername])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setUsername(value)
    setHasChanges(value !== (currentUsername ?? ''))
    setAvailable(null)
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length >= 3 && value !== currentUsername) {
      debounceRef.current = setTimeout(() => checkAvailability(value), 300)
    }
  }

  const handleSave = async () => {
    if (!USERNAME_REGEX.test(username) || isSaving) return
    await onSave(username)
    setHasChanges(false)
    setAvailable(null)
  }

  const canSave = hasChanges && USERNAME_REGEX.test(username) && available === true && !checking

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center border-2 border-black bg-background">
          <span className="pl-4 pr-1 font-serif text-sepia-dark text-sm">@</span>
          <input
            type="text"
            value={username}
            onChange={handleChange}
            placeholder={t('usernamePlaceholder')}
            maxLength={30}
            className="w-full px-2 py-3 bg-transparent font-serif text-sm focus:outline-none"
          />
          <div className="pr-3 flex items-center">
            {checking && <Loader2 size={16} className="animate-spin text-sepia-dark" />}
            {!checking && available === true && <Check size={16} className="text-green-600" />}
            {!checking && available === false && <X size={16} className="text-[#E63946]" />}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <span className="text-xs font-serif text-[#E63946]">{t(error)}</span>
          )}
          {!error && (
            <span className="text-xs font-serif text-sepia-dark">{t('usernameHelp')}</span>
          )}
        </div>

        {canSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ml-4 px-6 py-2 bg-[#FFD600] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-serif uppercase tracking-widest font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isSaving ? t('saving') : currentUsername ? t('changeUsername') : t('setUsername')}
          </button>
        )}
      </div>

      {currentUsername && hasChanges && username.length >= 3 && (
        <div className="flex items-start gap-2 p-3 bg-[#FFD600]/10 border-2 border-[#FFD600]/30">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-sepia-dark" />
          <span className="text-xs font-serif text-sepia-dark">{t('usernameChangeWarning')}</span>
        </div>
      )}
    </div>
  )
}
