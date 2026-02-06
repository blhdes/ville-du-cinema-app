'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Upload, Link as LinkIcon, Trash2, Camera, Loader2, Check, X } from 'lucide-react'

interface AvatarUploaderProps {
  currentAvatarUrl: string | null
  onUpload: (file: File) => Promise<string>
  onSetUrl: (url: string) => Promise<void>
  onRemove: () => Promise<void>
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_DIMENSION = 400

// Resize image client-side before upload
async function resizeImage(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        0.9
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export default function AvatarUploader({
  currentAvatarUrl,
  onUpload,
  onSetUrl,
  onRemove,
}: AvatarUploaderProps) {
  const t = useTranslations('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('invalidImage'))
      return
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError(t('imageTooLarge'))
      return
    }

    try {
      setIsUploading(true)

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Resize image
      const resizedFile = await resizeImage(file, MAX_DIMENSION)

      // Upload
      await onUpload(resizedFile)
      setPreviewUrl(null)
    } catch {
      setError(t('uploadError'))
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const validateAndSetUrl = async () => {
    if (!urlInput.trim()) return

    setUrlError(null)
    setIsValidatingUrl(true)

    try {
      // Try to fetch the image to validate it
      const response = await fetch(urlInput, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')

      if (!contentType?.startsWith('image/')) {
        setUrlError(t('invalidImage'))
        return
      }

      await onSetUrl(urlInput)
      setShowUrlInput(false)
      setUrlInput('')
    } catch {
      setUrlError(t('invalidImage'))
    } finally {
      setIsValidatingUrl(false)
    }
  }

  const handleRemove = async () => {
    try {
      await onRemove()
    } catch {
      setError(t('uploadError'))
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Avatar Preview */}
        <div className="flex-shrink-0">
          {displayUrl ? (
            <div className="relative">
              <Image
                src={displayUrl}
                alt="Avatar"
                width={120}
                height={120}
                className="w-[120px] h-[120px] border-4 border-black object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#FFD600] animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-[120px] h-[120px] border-4 border-black bg-[#f4efdf] flex items-center justify-center">
              <Camera size={40} className="text-sepia-dark/50" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {t('uploadImage')}
          </button>

          {/* Use URL Button */}
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-foreground/5 transition-colors"
          >
            <LinkIcon size={14} />
            {t('useUrl')}
          </button>

          {/* Remove Button */}
          {currentAvatarUrl && (
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#E63946] text-[#E63946] bg-background text-sm font-serif uppercase tracking-widest font-bold hover:bg-[#E63946]/10 transition-colors"
            >
              <Trash2 size={14} />
              {t('removeImage')}
            </button>
          )}
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value)
              setUrlError(null)
            }}
            placeholder={t('enterImageUrl')}
            className="flex-1 px-4 py-2 border-2 border-black bg-background font-serif text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
          />
          <button
            onClick={validateAndSetUrl}
            disabled={isValidatingUrl || !urlInput.trim()}
            className="px-4 py-2 border-2 border-black bg-[#FFD600] hover:bg-[#FFD600]/80 transition-colors disabled:opacity-50"
          >
            {isValidatingUrl ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </button>
          <button
            onClick={() => {
              setShowUrlInput(false)
              setUrlInput('')
              setUrlError(null)
            }}
            className="px-4 py-2 border-2 border-black bg-background hover:bg-foreground/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Errors */}
      {(error || urlError) && (
        <div className="bg-[#E63946]/10 border-2 border-[#E63946] text-[#E63946] px-4 py-2 text-sm font-serif">
          {error || urlError}
        </div>
      )}
    </div>
  )
}
