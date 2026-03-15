import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as api from '../services/apiService'
import { Card, Button, Input, Label } from '../components/ui'
import { Loader2, CheckCircle2 } from 'lucide-react'

export const ForgotPassword = () => {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.requestPasswordReset(email)
      setIsSubmitted(true)
    } catch (err) {
      // In a real app, you might show an error, but here we'll just succeed.
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-8 shadow-lg">
      {!isSubmitted ? (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('forgotPasswordTitle')}</h1>
            <p className="text-slate-500 text-sm">{t('forgotPasswordSubtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('emailPlaceholder')} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('sendRecoveryLink')}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{t('checkYourEmail')}</h1>
          <p className="text-slate-500 text-sm mt-2">
            {t('recoveryLinkSent', { email })}
          </p>
        </div>
      )}
      <p className="text-center text-sm text-slate-500 mt-6">
        {t('rememberedPassword')}{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </Card>
  )
}
