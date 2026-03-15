import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { type SystemFeature } from '../../../types'
import { Button, Input, Label } from '../../atoms'
import { ModalShell } from '../../molecules'

interface FeatureEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { key: string; name: string; description?: string }) => void
  initialData: SystemFeature | null
}

export const FeatureEditorModal: React.FC<FeatureEditorModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const [key, setKey] = useState(initialData?.key ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')

  useEffect(() => {
    setKey(initialData?.key ?? '')
    setName(initialData?.name ?? '')
    setDescription(initialData?.description ?? '')
  }, [initialData])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave({ key, name, description: description || undefined })
  }

  if (!isOpen) return null

  return (
    <ModalShell title={initialData ? t('editFeature') : t('newFeature')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feature-key">{t('featureKey')}</Label>
          <Input id="feature-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder={t('featureKeyPlaceholder')} required disabled={!!initialData} pattern="^[a-z][a-z0-9_]*$" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-name">{t('featureName')}</Label>
          <Input id="feature-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('featureNamePlaceholder')} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-description">{t('featureDescription')}</Label>
          <textarea
            id="feature-description"
            rows={3}
            className="w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 ring-offset-white focus-visible:outline-none placeholder:text-slate-500"
            placeholder={t('featureDescriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button type="submit">{t('saveSettings')}</Button>
        </div>
      </form>
    </ModalShell>
  )
}
