import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card } from '../../atoms'

export interface WeeklyScheduleData {
  name: string
  sessions: number
}

export interface WeeklyOverviewCardProps {
  data: WeeklyScheduleData[]
}

/**
 * Component to display a bar chart of the weekly schedule data.
 */
export const WeeklyOverviewCard: React.FC<WeeklyOverviewCardProps> = ({ data }) => {
  const { t } = useTranslation('schedule')

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('weeklyOverview')}</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="sessions" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
