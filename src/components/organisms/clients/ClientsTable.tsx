import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Phone, Mail, Globe, MapPin, Eye, Pencil, Wallet, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ClientStatus } from '../../../types'
import type { Client, Plan } from '../../../types'
import { Card, Button, Badge } from '../../atoms'
import { SearchBar, Pagination } from '../../molecules'
import { usePagination } from '../../../hooks/usePagination'

export type ClientSortField = 'name' | 'status' | 'plan' | 'modality' | 'email'
export type SortDirection = 'asc' | 'desc'

/**
 * Props for the `ClientsTable` organism component.
 */
export interface ClientsTableProps {
  /** Array of clients to display */
  clients: Client[]
  /** Array of available subscription plans */
  plans: Plan[]
  /** Current search input term */
  searchTerm: string
  /** Callback fired when search term changes */
  onSearchChange: (value: string) => void
  /** Callback fired when edit button for a client is clicked */
  onEditClient?: (client: Client) => void
  /** Initial number of items per page for pagination. Defaults to 10. */
  initialItemsPerPage?: number
}

/**
 * Clients table component featuring search filtering, responsive layout,
 * interactive column sorting, action triggers, and generic pagination integration.
 */
export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, plans, searchTerm, onSearchChange, onEditClient, initialItemsPerPage = 10 }) => {
  const { t } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const navigate = useNavigate()

  const [sortField, setSortField] = useState<ClientSortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: ClientSortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedClients = useMemo(() => {
    const filtered = clients.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!sortField) return filtered

    return [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '')
      } else if (sortField === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '')
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '')
      } else if (sortField === 'modality') {
        comparison = (a.modality || '').localeCompare(b.modality || '')
      } else if (sortField === 'plan') {
        const planA = plans.find((p) => p.id === a.planId)?.name || ''
        const planB = plans.find((p) => p.id === b.planId)?.name || ''
        comparison = planA.localeCompare(planB)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [clients, searchTerm, sortField, sortDirection, plans])

  const { paginatedItems, currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage, pageSizeOptions, setPage, setItemsPerPage } = usePagination(sortedClients, { initialItemsPerPage })

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const renderSortIcon = (field: ClientSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 opacity-60 inline" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-indigo-600 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-indigo-600 inline" />
    )
  }

  return (
    <Card data-testid="clients-table" className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-4">
        <SearchBar value={searchTerm} onChange={onSearchChange} placeholder={t('searchPlaceholder')} />
        <div className="flex-1" />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => handleSort('name')} data-testid="sort-header-name">
                <span className="flex items-center">
                  {t('name')}
                  {renderSortIcon('name')}
                </span>
              </th>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => handleSort('status')} data-testid="sort-header-status">
                <span className="flex items-center">
                  {t('status')}
                  {renderSortIcon('status')}
                </span>
              </th>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => handleSort('plan')} data-testid="sort-header-plan">
                <span className="flex items-center">
                  {t('plan')}
                  {renderSortIcon('plan')}
                </span>
              </th>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => handleSort('modality')} data-testid="sort-header-modality">
                <span className="flex items-center">
                  {t('modality')}
                  {renderSortIcon('modality')}
                </span>
              </th>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => handleSort('email')} data-testid="sort-header-email">
                <span className="flex items-center">
                  {t('email')}
                  {renderSortIcon('email')}
                </span>
              </th>
              <th className="px-6 py-4 text-right">{tco('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedItems.map((client) => {
              const clientPlan = plans.find((p) => p.id === client.planId)
              const statusVariant =
                client.status === ClientStatus.ACTIVE
                  ? 'success'
                  : client.status === ClientStatus.PAUSED
                  ? 'warning'
                  : client.status === ClientStatus.OVERDUE
                  ? 'error'
                  : 'default'


              return (
                <tr key={client.id} data-testid={`client-row-${client.id}`} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {client.avatar ? (
                        <img src={client.avatar} alt={client.name} className="h-10 w-10 rounded-full bg-slate-200 object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 object-cover flex items-center justify-center">
                          <User className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-slate-500 text-xs">ID: #{client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={statusVariant}>
                        {t(`status.${(client.status || 'ACTIVE').toLowerCase()}`, { ns: 'common' })}
                      </Badge>
                      {client.activeWorkoutSheet?.expiresAt && new Date(client.activeWorkoutSheet.expiresAt).getTime() - Date.now() < 5 * 24 * 3600 * 1000 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Ficha Vencendo</span>
                      )}
                    </div>
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
                    {/* Modality Tag */}
                    <div className="flex items-center gap-1.5">
                      {client.modality === 'ONLINE' ? (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          <Globe className="h-3 w-3 mr-1 text-blue-600" /> {t('modalityOnline')}
                        </span>
                      ) : client.modality === 'HYBRID' ? (
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                          {t('modalityHybrid')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          <MapPin className="h-3 w-3 mr-1 text-emerald-600" /> {t('modalityPresencial')}
                        </span>
                      )}
                    </div>
                    {(client.modality === 'ONLINE' || client.modality === 'HYBRID') && client.checkInFrequency && (
                      <div className="text-xs text-slate-400 mt-1">
                        {t('checkInsLabel', {
                          frequency: t(client.checkInFrequency === 'Weekly' ? 'frequencyWeekly' : client.checkInFrequency === 'Bi-weekly' ? 'frequencyBiweekly' : 'frequencyMonthly'),
                        })}
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
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title={t('editProfile')}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditClient?.(client)
                        }}
                      >
                        <Pencil className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title={tco('view')}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/clients/${client.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  {t('noClients')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        itemsPerPage={itemsPerPage}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </Card>
  )
}
