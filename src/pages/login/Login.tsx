import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dumbbell, ShieldCheck, Smartphone, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

import { useAuthStore } from '../../states/stores/auth/authStore'
import { Card, Button, Input, Label } from '../../components/ui'

export type AuthRolePerspective = 'trainer' | 'admin' | 'student'

/**
 * Login page component allowing users to authenticate into the application with role-aware UX.
 */
export const Login = () => {
  const { t } = useTranslation('auth')
  const [selectedRole, setSelectedRole] = useState<AuthRolePerspective>('trainer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [workoutSlug, setWorkoutSlug] = useState('')
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

  const handleStudentAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutSlug.trim()) return
    const cleaned = workoutSlug.replace(/^.*\/p\//, '').replace(/^.*\/workout-player\?code=/, '').trim()
    navigate(`/p/${cleaned}`)
  }

  return (
    <Card className="p-8 shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('welcomeBack')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('signInSubtitle')}</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="mb-6">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          {t('selectProfile')}
        </Label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('trainer')
              setError('')
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-md text-xs font-medium transition-all ${
              selectedRole === 'trainer'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Dumbbell className="h-4 w-4 mb-1" />
            <span>{t('roleTrainer')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin')
              setError('')
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-md text-xs font-medium transition-all ${
              selectedRole === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 mb-1" />
            <span>{t('roleAdmin')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('student')
              setError('')
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-md text-xs font-medium transition-all ${
              selectedRole === 'student'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Smartphone className="h-4 w-4 mb-1" />
            <span>{t('roleStudent')}</span>
          </button>
        </div>

        {/* Active Role Description Banner */}
        <div className="mt-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center gap-2">
          {selectedRole === 'trainer' && (
            <>
              <Dumbbell className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>{t('roleTrainerDesc')}</span>
            </>
          )}
          {selectedRole === 'admin' && (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>{t('roleAdminDesc')}</span>
            </>
          )}
          {selectedRole === 'student' && (
            <>
              <Smartphone className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>{t('studentPortalPrompt')}</span>
            </>
          )}
        </div>
      </div>

      {selectedRole === 'student' ? (
        /* Student Quick Access Form */
        <form onSubmit={handleStudentAccess} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workoutSlug">{t('workoutCodeOrSlug')}</Label>
            <Input
              id="workoutSlug"
              type="text"
              value={workoutSlug}
              onChange={(e) => setWorkoutSlug(e.target.value)}
              placeholder="ex: aluno-alex ou link"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {t('accessWorkout')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/workout-player')}
              className="text-xs text-indigo-600 hover:underline"
            >
              Abrir Workout Player sem código
            </button>
          </div>
        </form>
      ) : (
        /* Trainer / Admin Standard Auth Form */
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password">{t('password')}</Label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>
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
            {t('signIn')}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('noAccount')}{' '}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
          {t('signUp')}
        </Link>
      </p>
    </Card>
  )
}

