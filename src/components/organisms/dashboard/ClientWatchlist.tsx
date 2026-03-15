import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import type { Client } from '../../../types'
import { Card, Button } from '../../atoms'

interface ClientWatchlistProps {
  clients: Client[]
}

export const ClientWatchlist: React.FC<ClientWatchlistProps> = ({ clients }) => {
  const { t: tc } = useTranslation('clients')
  const { t: tco } = useTranslation('common')

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{tc('clientWatchlist')}</h3>
      <div className="space-y-3">
        {clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <img src={client.avatar} alt={client.name} className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <Link to={`/clients/${client.id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600">
                    {client.name}
                  </Link>
                  <p className="text-xs text-slate-400">{tc('needsFollowUp')}</p>
                </div>
              </div>
              <Link to={`/clients/${client.id}`}>
                <Button variant="secondary" className="h-8 px-3 text-xs">
                  {tco('view')}
                </Button>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-slate-500 py-4">{tc('noClientsToWatch')}</p>
        )}
      </div>
    </Card>
  )
}
