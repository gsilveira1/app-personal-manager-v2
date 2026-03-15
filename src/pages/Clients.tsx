import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { Button } from '../components/atoms'
import { ClientsTable } from '../components/organisms/clients/ClientsTable'
import { AddClientModal } from '../components/organisms/clients/AddClientModal'

export const Clients = () => {
  const { t } = useTranslation('clients')
  const { clients, plans, addClient } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addClient')}
        </Button>
      </div>

      <ClientsTable clients={filteredClients} plans={plans} searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} onSave={addClient} />}
    </div>
  )
}
