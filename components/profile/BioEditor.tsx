'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface BioEditorProps {
  currentBio: string
  onSave: (bio: string) => Promise<void>
  isSaving: boolean
}

const MAX_CHARS = 500

export default function BioEditor({ currentBio, onSave, isSaving }: BioEditorProps) {
  const t = useTranslations('profile')
  const [bio, setBio] = useState(currentBio)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setBio(currentBio)
  }, [currentBio])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_CHARS) {
      setBio(value)
      setHasChanges(value !== currentBio)
    }
  }

  const handleSave = async () => {
    await onSave(bio)
    setHasChanges(false)
  }

  const charCount = bio.length
  const isOverLimit = charCount > MAX_CHARS
  const isNearLimit = charCount > MAX_CHARS * 0.9

  return (
    <div className="space-y-4">
      <textarea
        value={bio}
        onChange={handleChange}
        placeholder={t('bioPlaceholder')}
        rows={5}
        className="w-full px-4 py-3 border-2 border-black bg-background font-serif text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD600] resize-none"
      />

      {/* Character count */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-serif ${
            isOverLimit
              ? 'text-[#E63946] font-bold'
              : isNearLimit
              ? 'text-[#E63946]/70'
              : 'text-sepia-dark'
          }`}
        >
          {t('bioCharCount', { count: charCount })}
        </span>

        {/* Save button - only show if there are changes */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving || isOverLimit}
            className="px-6 py-2 bg-[#E63946] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-serif uppercase tracking-widest font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('saving') : t('saveChanges')}
          </button>
        )}
      </div>
    </div>
  )
}
