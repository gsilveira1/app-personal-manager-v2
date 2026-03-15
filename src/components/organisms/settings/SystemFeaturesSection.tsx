import React, { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Shield, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type SystemFeature } from '../../../types'
import { Card, Button } from '../../atoms'
import * as api from '../../../services/apiService'
import { FeatureEditorModal } from './FeatureEditorModal'

export const SystemFeaturesSection: React.FC = () => {
  const { t } = useTranslation('settings')
  const [allFeatures, setAllFeatures] = useState<SystemFeature[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState<SystemFeature | null>(null)

  const fetchAll = async () => {
    try {
      const features = await api.getSystemFeatures()
      setAllFeatures(features)
    } catch (error) {
      console.error('Failed to fetch system features:', error)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleCreate = () => {
    setEditingFeature(null)
    setIsModalOpen(true)
  }

  const handleEdit = (feature: SystemFeature) => {
    setEditingFeature(feature)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('deleteFeatureConfirm'))) {
      try {
        await api.deleteSystemFeature(id)
        setAllFeatures((prev) => prev.filter((f) => f.id !== id))
      } catch (error) {
        console.error('Failed to delete system feature:', error)
      }
    }
  }

  const handleToggleActive = async (feature: SystemFeature) => {
    try {
      const updated = await api.updateSystemFeature(feature.id, { isActive: !feature.isActive })
      setAllFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    } catch (error) {
      console.error('Failed to toggle system feature:', error)
    }
  }

  const handleSave = async (data: { key: string; name: string; description?: string }) => {
    try {
      if (editingFeature) {
        const updated = await api.updateSystemFeature(editingFeature.id, data)
        setAllFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      } else {
        const created = await api.createSystemFeature(data)
        setAllFeatures((prev) => [...prev, created])
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save system feature:', error)
    }
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Shield className="mr-3 h-5 w-5 text-amber-600" />
            {t('systemFeatures')}
          </h2>
          <p className="text-sm text-slate-500">{t('systemFeaturesSubtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t('newFeature')}
        </Button>
      </div>
      <div className="p-6">
        {allFeatures.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noFeaturesCreated')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(feature)}
                    className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${feature.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${feature.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="font-medium text-slate-900">{feature.name}</p>
                    <p className="text-xs text-slate-400">
                      <code>{feature.key}</code>
                      {feature._count?.plans !== undefined && (
                        <span className="ml-2">
                          &middot; {feature._count.plans} {t('plansUsingFeature')}
                        </span>
                      )}
                    </p>
                    {feature.description && <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(feature)}>
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(feature.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <FeatureEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingFeature} />}
    </Card>
  )
}
