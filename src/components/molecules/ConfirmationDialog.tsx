import React from 'react'
import { ModalShell } from './ModalShell'
import { Button } from '../atoms/Button'

interface ConfirmationDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  variant?: 'danger' | 'primary'
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
  variant = 'primary',
}) => (
  <ModalShell title={title} onClose={onCancel} maxWidth="max-w-sm">
    <div className="p-6 space-y-4">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? '...' : confirmLabel}
        </Button>
      </div>
    </div>
  </ModalShell>
)
