import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as api from '../../services/api/apiService'
import { Card, Button, Input, Label } from '../../components/ui'
import { Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

/**
 * Helper to extract reset token from URL (supports search params and hash query params).
 */
export const extractTokenFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  // 1. Check window.location.search
  const searchParams = new URLSearchParams(window.location.search)
  const tokenFromSearch = searchParams.get('token')
  if (tokenFromSearch) return tokenFromSearch

  // 2. Check window.location.hash (e.g. #/reset-password?token=...)
  const hash = window.location.hash || ''
  if (hash.includes('?')) {
    const hashParams = new URLSearchParams(hash.split('?')[1])
    const tokenFromHash = hashParams.get('token')
    if (tokenFromHash) return tokenFromHash
  }

  return null
}

/**
 * ResetPassword page component allowing users to set a new password using a recovery token.
 */
export const ResetPassword = () => {
  const { t } = useTranslation('auth')
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const extractedToken = extractTokenFromUrl()
    setToken(extractedToken)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage(t('invalidTokenSubtitle'))
      return
    }

    if (password.length < 8) {
      setErrorMessage(t('passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('passwordsDoNotMatch'))
      return
    }

    setIsLoading(true)
    try {
      await api.resetPassword(token, password)
      setIsSuccess(true)
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message
      setErrorMessage(serverMessage || t('failedResetPassword'))
    } finally {
      setIsLoading(false)
    }
  }

  // State 1: No token present in URL
  if (token === null && typeof window !== 'undefined' && !extractTokenFromUrl()) {
    return (
      <Card className="p-8 shadow-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{t('invalidTokenTitle')}</h1>
          <p className="text-slate-500 text-sm mt-2">{t('invalidTokenSubtitle')}</p>
          <div className="mt-6">
            <Link to="/forgot-password">
              <Button className="w-full">{t('requestNewLink')}</Button>
            </Link>
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </Card>
    )
  }

  // State 2: Password reset successfully
  if (isSuccess) {
    return (
      <Card className="p-8 shadow-lg">
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{t('passwordResetSuccessTitle')}</h1>
          <p className="text-slate-500 text-sm mt-2">{t('passwordResetSuccessSubtitle')}</p>
          <div className="mt-6">
            <Link to="/login">
              <Button className="w-full">{t('goToLogin')}</Button>
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  // State 3: Reset password form
  return (
    <Card className="p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t('resetPasswordTitle')}</h1>
        <p className="text-slate-500 text-sm">{t('resetPasswordSubtitle')}</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('newPassword')}</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t('newPasswordPlaceholder')} autoComplete="new-password" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('confirmPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('resetPasswordSubmit')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        <Link to="/login" className="font-medium text-emerald-600 hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </Card>
  )
}
