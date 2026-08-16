import React, { useState, useEffect, useRef } from 'react'
import { User as UserIcon, Camera, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '../../../states/stores/auth/authStore'
import { Card, Button, Input, Label, Textarea, Spinner } from '../../atoms'

/**
 * Organism component allowing personal trainers to edit their profile details
 * and upload a custom profile avatar photo via GCS signed URLs.
 *
 * @returns The rendered personal trainer profile editing section component.
 */
export const ProfileEditSection: React.FC = () => {
  const { t } = useTranslation('settings')
  const { user, updateProfile, uploadAvatar } = useAuthStore()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
    }
  }, [user])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: t('photoUploadError') })
      return
    }

    setIsUploading(true)
    setFeedback(null)
    try {
      await uploadAvatar(file)
      setFeedback({ type: 'success', message: t('photoUploadedSuccess') })
    } catch (err) {
      console.error('Failed to upload profile photo:', err)
      setFeedback({ type: 'error', message: t('photoUploadError') })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)
    try {
      await updateProfile({ name, email, phone, bio })
      setFeedback({ type: 'success', message: t('profileUpdatedSuccess') })
    } catch (err) {
      console.error('Failed to update profile:', err)
      setFeedback({ type: 'error', message: 'Erro ao salvar o perfil.' })
    } finally {
      setIsSaving(false)
    }
  }

  const avatarSrc = user?.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.email || 'trainer')}`

  return (
    <Card data-testid="profile-edit-section">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
          <UserIcon className="mr-3 h-5 w-5 text-indigo-600" />
          {t('trainerProfile')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t('trainerProfileSubtitle')}</p>
      </div>

      <div className="p-6 space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-lg flex items-center space-x-3 ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
            role="alert"
          >
            {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="relative">
            <img src={avatarSrc} alt={user?.name || t('trainerProfile')} className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500 shadow-sm" data-testid="trainer-avatar-img" />
            {isUploading && (
              <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center">
                <Spinner className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start space-y-2">
            <h3 className="text-base font-semibold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>

            <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" data-testid="avatar-file-input" />

            <Button type="button" variant="outline" className="text-xs px-3 py-1.5 h-8" onClick={() => fileInputRef.current?.click()} disabled={isUploading} data-testid="change-photo-btn">
              {isUploading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('uploadingPhoto')}
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4 text-indigo-600" />
                  {t('changePhoto')}
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4" data-testid="profile-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainer-name">{t('planName')}</Label>
              <Input id="trainer-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" data-testid="profile-name-input" />
            </div>

            <div>
              <Label htmlFor="trainer-email">Email</Label>
              <Input id="trainer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" data-testid="profile-email-input" />
            </div>
          </div>

          <div>
            <Label htmlFor="trainer-phone">{t('phoneLabel')}</Label>
            <Input id="trainer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} className="mt-1" data-testid="profile-phone-input" />
          </div>

          <div>
            <Label htmlFor="trainer-bio">{t('bioLabel')}</Label>
            <Textarea id="trainer-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('bioPlaceholder')} className="mt-1" data-testid="profile-bio-textarea" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} data-testid="save-profile-btn">
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('saveProfile')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('saveProfile')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
