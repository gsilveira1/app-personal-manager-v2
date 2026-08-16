import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { Button } from '../../components/atoms'
import { ClientsTable } from '../../components/organisms/clients/ClientsTable'
import { AddClientModal } from '../../components/organisms/clients/AddClientModal'
import { ClientProfileEditorModal } from '../../components/organisms/client-details/ClientProfileEditorModal'
import type { Client } from '../../types'

/**
 * Clients page component displaying a paginated list of clients with search, edit, and addition capabilities.
 *
 * @returns React functional component for Clients page
 * @example
 * <Clients />
 */
export const Clients = () => {
  const { t } = useTranslation('clients')
  const { clients, plans, addClient } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addClient')}
        </Button>
      </div>

      <ClientsTable
        clients={clients}
        plans={plans}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditClient={setEditingClient}
      />

      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} onSave={addClient} />}

      {editingClient && (
        <ClientProfileEditorModal
          isOpen={true}
          onClose={() => setEditingClient(null)}
          client={editingClient}
        />
      )}
    </div>
  )
}
