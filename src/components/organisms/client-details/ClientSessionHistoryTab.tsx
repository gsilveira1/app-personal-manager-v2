import { Plus, History, CheckCircle2, XCircle } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { formatLocalized } from '../../../utils/dateLocale'
import { Card, Button } from '../../atoms'
import type { Session } from '../../../types'

/**
 * Props for the ClientSessionHistoryTab component.
 */
export interface ClientSessionHistoryTabProps {
  /** The list of sessions for the client. */
  clientSessions: Session[]
}

/**
 * Displays a list of the client's past sessions.
 *
 * @param props - The component props.
 * @returns The session history tab content.
 */
export const ClientSessionHistoryTab = ({ clientSessions }: ClientSessionHistoryTabProps) => {
  const { t } = useTranslation('clients')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">{t('sessionHistory')}</h3>
      </div>
      {clientSessions.length > 0 ? (
        clientSessions.map((session) => (
          <Card key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-2 rounded-full ${session.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {session.completed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{formatLocalized(parseISO(session.date), 'EEEE, MMMM d, yyyy')}</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {formatLocalized(parseISO(session.date), 'h:mm a')} • {session.durationMinutes} min • {session.type}
                </div>
                {session.notes && <div className="mt-2 text-sm bg-slate-50 p-2 rounded text-slate-600">"{session.notes}"</div>}
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">{t('noSessions')}</h3>
        </div>
      )}
    </div>
  )
}
