import { useState } from 'react'
import { Plus, Download, AlertTriangle, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { Button } from '../../components/atoms'
import { ClientsTable } from '../../components/organisms/clients/ClientsTable'
import { AddClientModal } from '../../components/organisms/clients/AddClientModal'
import { ClientProfileEditorModal } from '../../components/organisms/client-details/ClientProfileEditorModal'
import * as api from '../../services/api/apiService'
import type { Client } from '../../types'

export const Clients = () => {
  const { t } = useTranslation('clients')
  const { clients, plans, addClient } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Filters for Feature 002 and Feature 006
  const [modalityFilter, setModalityFilter] = useState<'ALL' | 'ONLINE' | 'PRESENCIAL' | 'HYBRID'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'INACTIVE'>('ALL')
  const [onlyExpiringSheets, setOnlyExpiringSheets] = useState(false)

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank')
  }

  const filteredClients = clients.filter((c) => {
    // Modality match
    if (modalityFilter !== 'ALL') {
      const clientMod = c.modality || (c.type === 'In-Person' ? 'PRESENCIAL' : 'ONLINE')
      if (clientMod !== modalityFilter) return false
    }

    // Status match
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PAUSED' && c.subscriptionStatus !== 'PAUSED') return false
      if (statusFilter === 'ACTIVE' && (c.subscriptionStatus === 'PAUSED' || c.status !== 'Active')) return false
      if (statusFilter === 'INACTIVE' && c.status !== 'Inactive') return false
    }

    // Expiring sheet match (<= 5 days)
    if (onlyExpiringSheets) {
      if (!c.activeWorkoutSheet?.expiresAt) return false
      const daysLeft = (new Date(c.activeWorkoutSheet.expiresAt).getTime() - Date.now()) / (1000 * 3600 * 24)
      if (daysLeft < 0 || daysLeft > 5) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão unificada de alunos online, presenciais e híbridos</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4 text-slate-600" />
            Exportar CSV
          </Button>

          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            {t('addClient')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center mr-1">
            <Filter className="mr-1 h-3.5 w-3.5" /> Modalidade:
          </span>
          {(['ALL', 'ONLINE', 'PRESENCIAL', 'HYBRID'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModalityFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${modalityFilter === m ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {m === 'ALL' ? 'Todas' : m === 'ONLINE' ? 'Online' : m === 'PRESENCIAL' ? 'Presencial' : 'Híbrido'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOnlyExpiringSheets(!onlyExpiringSheets)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
              onlyExpiringSheets ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Fichas Prestes a Vencer
          </button>
        </div>
      </div>

      <ClientsTable clients={filteredClients} plans={plans} searchTerm={searchTerm} onSearchChange={setSearchTerm} onEditClient={setEditingClient} />

      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} onSave={addClient} />}

      {editingClient && <ClientProfileEditorModal isOpen={true} onClose={() => setEditingClient(null)} client={editingClient} />}
    </div>
  )
}
