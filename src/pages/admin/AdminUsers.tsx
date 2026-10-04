import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, Edit3 } from 'lucide-react'
import { Card, Button } from '../../components/atoms'
import { AdminUserEditModal } from '../../components/organisms/admin'
import * as api from '../../services/api/apiService'
import type { AccountLimits, AccountStatus, AdminUserView } from '../../types'

const STATUS_FILTERS = [
  { id: '', label: 'Todas as contas' },
  { id: 'ACTIVE', label: 'Ativos' },
  { id: 'BLOCKED', label: 'Bloqueados' },
  { id: 'OVERDUE', label: 'Inadimplentes' },
]

const STATUS_BADGE: Record<AccountStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  BLOCKED: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-amber-100 text-amber-800',
}

/** Admin console: trainer accounts, their status and limits. New accounts come from sign-up. */
export const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUserView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingUser, setEditingUser] = useState<AdminUserView | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await api.getAdminUsers({ status: statusFilter || undefined })
      setUsers(res.items)
    } catch (err) {
      console.error('Error fetching admin users:', err)
      setLoadError(err instanceof Error && err.message ? err.message : 'Erro ao carregar as contas')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSave = async (id: string, data: { status: AccountStatus; limits: AccountLimits }) => {
    await api.updateAdminUser(id, data)
    setEditingUser(null)
    await loadUsers()
  }

  const renderRows = () => {
    if (isLoading) return <StateRow text="Carregando contas..." />
    if (loadError) return <StateRow text={loadError} isError />
    if (users.length === 0) return <StateRow text="Nenhuma conta encontrada." />
    return users.map((u) => (
      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
        <td className="px-6 py-4">
          <div className="font-bold text-slate-900">{u.name}</div>
          <div className="text-xs text-slate-500">{u.email}</div>
        </td>
        <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.slug}</td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            {u.studentsCount} / {u.limits.maxStudents}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_BADGE[u.status]}`}>{u.status}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {u.limits.canUploadVideos && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">Vídeos</span>}
            {u.limits.whatsappAlerts && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">WhatsApp</span>}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
            <Edit3 className="mr-1 h-3.5 w-3.5" /> Editar
          </Button>
        </td>
      </tr>
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Shield className="mr-2 h-6 w-6 text-indigo-600" />
          Gestão de Contas e Limites (Super Admin)
        </h1>
        <p className="text-sm text-slate-500 mt-1">Controle de assinaturas de Personal Trainers e limites da plataforma</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === f.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Personal</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Alunos Ativos</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Limites</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">{renderRows()}</tbody>
        </table>
      </Card>

      {editingUser && <AdminUserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />}
    </div>
  )
}

const StateRow = ({ text, isError = false }: { text: string; isError?: boolean }) => (
  <tr>
    <td colSpan={6} role={isError ? 'alert' : undefined} className={`px-6 py-8 text-center ${isError ? 'text-red-700' : 'text-slate-500'}`}>
      {text}
    </td>
  </tr>
)
