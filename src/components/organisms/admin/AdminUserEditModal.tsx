import { useState } from 'react'
import { Card, Button, Input, Label } from '../../atoms'
import type { AccountLimits, AccountStatus, AdminUserView } from '../../../types'

interface AdminUserEditModalProps {
  user: AdminUserView
  onClose: () => void
  onSave: (id: string, data: { status: AccountStatus; limits: AccountLimits }) => Promise<void>
}

export const AdminUserEditModal = ({ user, onClose, onSave }: AdminUserEditModalProps) => {
  const [status, setStatus] = useState<AccountStatus>(user.status)
  const [maxStudents, setMaxStudents] = useState(String(user.limits.maxStudents))
  const [canUploadVideos, setCanUploadVideos] = useState(user.limits.canUploadVideos)
  const [whatsappAlerts, setWhatsappAlerts] = useState(user.limits.whatsappAlerts)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedMax = Number(maxStudents)
    if (!Number.isInteger(parsedMax) || parsedMax < 0) {
      setError('Informe um limite de alunos válido.')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      await onSave(user.id, { status, limits: { maxStudents: parsedMax, canUploadVideos, whatsappAlerts } })
    } catch (err) {
      console.error('Failed to update account', { id: user.id, err })
      setError(err instanceof Error && err.message ? err.message : 'Erro ao atualizar a conta')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 bg-white shadow-2xl space-y-4">
        <h3 className="font-bold text-slate-900 text-lg">Editar conta: {user.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-user-status" className="text-xs font-semibold text-slate-700">
              Status da conta
            </Label>
            <select id="admin-user-status" value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm bg-white">
              <option value="ACTIVE">ACTIVE (Ativo)</option>
              <option value="BLOCKED">BLOCKED (Bloqueado por Inadimplência)</option>
              <option value="OVERDUE">OVERDUE (Atrasado)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="admin-user-max-students" className="text-xs font-semibold text-slate-700">
              Limite de Alunos
            </Label>
            <Input id="admin-user-max-students" type="number" min={0} value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} />
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={canUploadVideos} onChange={(e) => setCanUploadVideos(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Habilitar Upload de Vídeos de Exercícios
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={whatsappAlerts} onChange={(e) => setWhatsappAlerts(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Habilitar Alertas e Disparos no WhatsApp
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white" disabled={isSaving}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
