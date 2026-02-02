'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

export default function SignupPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError(t('errors.weakPassword'))
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError(t('errors.emailInUse'))
      } else {
        setError(t('errors.generic'))
      }
      setIsLoading(false)
      return
    }

    // Redirect to home after signup
    router.push('/')
    router.refresh()
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size={60} className="mx-auto hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-3xl font-serif font-black uppercase tracking-tight mb-2">
            {t('signup')}
          </h1>
          <p className="text-sm text-sepia-dark font-serif italic">
            {t('syncPrompt')}
          </p>
        </div>

        {/* Form Card */}
        <div className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-widest mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia-dark" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-black bg-background font-serif text-sm focus:outline-none focus:border-[#2E86AB] transition-colors"
                  placeholder="cinephile@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-widest mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia-dark" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-black bg-background font-serif text-sm focus:outline-none focus:border-[#2E86AB] transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-widest mb-2">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sepia-dark" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-black bg-background font-serif text-sm focus:outline-none focus:border-[#2E86AB] transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#E63946]/10 border-2 border-[#E63946] text-[#E63946] px-4 py-3 text-sm font-serif">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 font-serif uppercase tracking-widest text-sm font-bold hover:bg-[#2E86AB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : t('signup')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-foreground/20"></div>
            <span className="px-4 text-xs text-sepia-dark font-serif uppercase tracking-widest">ou</span>
            <div className="flex-1 border-t border-foreground/20"></div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignup}
            type="button"
            className="w-full border-2 border-black py-3 font-serif uppercase tracking-widest text-sm hover:bg-foreground/5 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          {/* Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm font-serif text-sepia-dark">
              {t('haveAccount')}{' '}
              <Link href="/login" className="text-[#2E86AB] hover:underline font-medium">
                {t('login')}
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} />
              {t('continueAsGuest')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
