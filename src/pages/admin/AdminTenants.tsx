import { useState, useEffect } from 'react'
import { Shield, Plus, Users, Settings2, CheckCircle2, AlertOctagon, Edit3 } from 'lucide-react'
import { Card, Button, Input, Label } from '../../components/atoms'
import * as api from '../../services/api/apiService'
import type { AdminTenant } from '../../types'

export const AdminTenants = () => {
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<AdminTenant | null>(null)

  // Create Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [maxStudents, setMaxStudents] = useState(50)
  const [canUploadVideos, setCanUploadVideos] = useState(true)
  const [whatsappAlerts, setWhatsappAlerts] = useState(true)

  // Edit Form State
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BLOCKED' | 'OVERDUE'>('ACTIVE')
  const [editFeaturesJson, setEditFeaturesJson] = useState('')

  const loadTenants = async () => {
    setIsLoading(true)
    try {
      const res = await api.getAdminTenants({ status: statusFilter || undefined })
      setTenants(res.items || [])
    } catch (err) {
      console.error('Error fetching admin tenants:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [statusFilter])

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createAdminTenant({
        name,
        slug,
        email,
        maxStudents,
        canUploadVideos,
        whatsappAlerts,
      })
      setIsCreateModalOpen(false)
      setName('')
      setSlug('')
      setEmail('')
      await loadTenants()
    } catch (err: any) {
      alert(err.message || 'Erro ao criar tenant')
    }
  }

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTenant) return
    try {
      let parsedFeatures = editingTenant.features
      if (editFeaturesJson) {
        parsedFeatures = JSON.parse(editFeaturesJson)
      }
      await api.updateAdminTenant(editingTenant.id, {
        status: editStatus,
        features: parsedFeatures,
      })
      setEditingTenant(null)
      await loadTenants()
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar tenant')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Shield className="mr-2 h-6 w-6 text-indigo-600" />
            Gestão de Tenants e Feature Flags (Super Admin)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Controle de assinaturas de Personal Trainers e limites da plataforma</p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Personal Trainer
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { id: '', label: 'Todos os Tenants' },
          { id: 'ACTIVE', label: 'Ativos' },
          { id: 'BLOCKED', label: 'Bloqueados' },
          { id: 'OVERDUE', label: 'Inadimplentes' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === f.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tenants Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Tenant / Personal</th>
              <th className="px-6 py-3">Slug / Domínio</th>
              <th className="px-6 py-3">Alunos Ativos</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Feature Flags</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{t.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{t.slug}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-slate-400" />
                    {t.studentsCount} / {t.features?.maxStudents || '∞'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : t.status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {t.features?.canUploadVideos && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">Vídeos R2</span>}
                    {t.features?.whatsappAlerts && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">WhatsApp BullMQ</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTenant(t)
                      setEditStatus(t.status)
                      setEditFeaturesJson(JSON.stringify(t.features, null, 2))
                    }}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create Tenant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Provisionar Novo Personal Trainer</h3>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Nome do Treinador / Negócio</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Personal Viviana" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Slug (URL)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="viviana" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">E-mail do Treinador</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="viviana@email.com" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Limite de Alunos</Label>
                <Input type="number" value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 50)} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Criar Tenant
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Editar Tenant: {editingTenant.name}</h3>
            <form onSubmit={handleUpdateTenant} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Status do Tenant</Label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm bg-white">
                  <option value="ACTIVE">ACTIVE (Ativo)</option>
                  <option value="BLOCKED">BLOCKED (Bloqueado por Inadimplência)</option>
                  <option value="OVERDUE">OVERDUE (Atrasado)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Feature Flags (JSON)</Label>
                <textarea value={editFeaturesJson} onChange={(e) => setEditFeaturesJson(e.target.value)} className="mt-1 w-full font-mono text-xs rounded-md border border-slate-300 p-2 h-36" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditingTenant(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
