import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'
import { Dumbbell, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '../../states/stores/auth/authStore'
import { Card, Button, Input, Label } from '../../components/ui'

/**
 * SignUp page component allowing users to create a new account with ADR-004 auto-tenant provision awareness.
 */
export const SignUp = () => {
  const { t } = useTranslation('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await signup(name, email, password)
      navigate('/login')
    } catch (err: any) {
      setError(err.message || t('failedSignup'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-8 shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('createAccount')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('createAccountSubtitle')}</p>
      </div>

      {/* Role Profile Badge & Auto-Provision Notice (ADR-004) */}
      <div className="mb-5 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <Dumbbell className="h-4 w-4 text-indigo-600" />
          <span>{t('roleTrainer')}</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          {t('autoStudioNotice')}
        </p>
        {name.trim() && (
          <div className="mt-2 pt-2 border-t border-indigo-200/50 flex items-center gap-1.5 text-indigo-700 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('studioPreview', { name: name.trim() })}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('fullName')}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t('fullNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('emailPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('createAccount')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </Card>
  )
}

