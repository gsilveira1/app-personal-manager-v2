import React from 'react'
import { useNavigate } from 'react-router'
import { Phone, Mail, Globe, MapPin, Eye, Wallet, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ClientStatus } from '../../../types'
import type { Client, Plan } from '../../../types'
import { Card, Button, Badge } from '../../atoms'
import { SearchBar } from '../../molecules'

interface ClientsTableProps {
  clients: Client[]
  plans: Plan[]
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, plans, searchTerm, onSearchChange }) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const navigate = useNavigate()

  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-4">
        <SearchBar value={searchTerm} onChange={onSearchChange} placeholder={t('searchPlaceholder')} />
        <div className="flex-1" />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">{t('name')}</th>
              <th className="px-6 py-4">{t('status')}</th>
              <th className="px-6 py-4">{t('plan')}</th>
              <th className="px-6 py-4">{t('type')}</th>
              <th className="px-6 py-4">{t('email')}</th>
              <th className="px-6 py-4 text-right">{tco('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClients.map((client) => {
              const clientPlan = plans.find((p) => p.id === client.planId)
              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {client.avatar ? (
                        <img src={client.avatar} alt={client.name} className="h-10 w-10 rounded-full bg-slate-200 object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 object-cover">
                          <User className="h-10 w-10 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-slate-500 text-xs">ID: #{client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={client.status === ClientStatus.Active ? 'success' : 'default'}>{t(`status.${client.status.toLowerCase()}`, { ns: 'common' })}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {clientPlan ? (
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3 w-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{clientPlan.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">{t('noPlan')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-600">
                      {client.type === 'Online' ? <Globe className="h-3 w-3 mr-1.5 text-indigo-500" /> : <MapPin className="h-3 w-3 mr-1.5 text-emerald-500" />}
                      {client.type === 'Online' ? t('online') : t('inPerson')}
                    </div>
                    {client.type === 'Online' && client.checkInFrequency && (
                      <div className="text-xs text-slate-400 mt-1">
                        {t('checkInsLabel', { frequency: t(client.checkInFrequency === 'Weekly' ? 'frequencyWeekly' : client.checkInFrequency === 'Bi-weekly' ? 'frequencyBiweekly' : 'frequencyMonthly') })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/clients/${client.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                    </Button>
                  </td>
                </tr>
              )
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  {t('noClients')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
