import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Label } from '../components/ui'
import { Loader2 } from 'lucide-react'

export const Login = () => {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || t('failedLogin'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-8 shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('welcomeBack')}</h1>
        <p className="text-slate-500 text-sm">{t('signInSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('emailPlaceholder')} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">{t('password')}</Label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('signIn')}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        {t('noAccount')}{' '}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
          {t('signUp')}
        </Link>
      </p>
    </Card>
  )
}
