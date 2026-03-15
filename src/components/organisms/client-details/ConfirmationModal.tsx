import React from 'react'
import { useTranslation } from 'react-i18next'

import { Card, Button } from '../../atoms'

interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Local ConfirmationModal kept for backward-compatibility with EvaluationCard.
 * Consider migrating usages to the ConfirmationDialog molecule
 * (src/components/molecules/ConfirmationDialog.tsx) which uses ModalShell.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  const { t: tc } = useTranslation('common')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel}>
              {tc('cancel')}
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              {tc('confirm')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
