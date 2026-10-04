import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Palette, MessageSquare, ShieldCheck } from 'lucide-react'
import { useAccountStore } from '../../states/stores/account/accountStore'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { BrandingStep } from './steps/BrandingStep'
import { WhatsAppStep } from './steps/WhatsAppStep'

export const SetupWizard: React.FC = () => {
  const { t } = useTranslation('setupWizard')
  const navigate = useNavigate()
  const { fetchAccount, account } = useAccountStore()
  const { checkAuthStatus } = useAuthStore()

  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  // If already completed, redirect to dashboard
  useEffect(() => {
    if (account?.setupCompleted) {
      navigate('/', { replace: true })
    }
  }, [account?.setupCompleted, navigate])

  const handleStep1Complete = () => {
    setCurrentStep(2)
  }

  const handleStep2Complete = async () => {
    // Refresh auth store so user.setupCompleted is updated in global state
    await checkAuthStatus()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" data-testid="setup-wizard-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 text-emerald-700 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-base text-slate-600 max-w-lg mx-auto">{t('subtitle')}</p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentStep === 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-700 border border-emerald-200'
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>1. {t('step1.title')}</span>
            </div>

            <div className="h-0.5 w-12 bg-slate-300 rounded" />

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentStep === 2 ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>2. {t('step2.title')}</span>
            </div>
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200/80">
          {currentStep === 1 && <BrandingStep onComplete={handleStep1Complete} />}
          {currentStep === 2 && <WhatsAppStep onComplete={handleStep2Complete} />}
        </div>
      </div>
    </div>
  )
}
