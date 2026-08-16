import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, Label, Select } from '../../atoms'

export interface ChartDataPoint {
  date: string
  value: number
}

export interface ChartableMetric {
  label: string
  unit: string
}

export interface ChartableMetricItem {
  id: string
  label: string
  unit: string
}

interface ProgressChartProps {
  chartData: ChartDataPoint[]
  selectedMetric: string
  onMetricChange: (metric: string) => void
  chartableMetrics: ChartableMetricItem[] | Record<string, ChartableMetric>
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ chartData, selectedMetric, onMetricChange, chartableMetrics }) => {
  const { t } = useTranslation('clients')

  const metricList = Array.isArray(chartableMetrics)
    ? chartableMetrics.map((m) => ({ key: m.id, label: m.label, unit: m.unit }))
    : Object.entries(chartableMetrics).map(([key, m]) => ({ key, label: m.label, unit: m.unit }))

  const currentMetric = metricList.find((m) => m.key === selectedMetric) || metricList[0]

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h4 className="text-sm font-medium text-slate-500 whitespace-nowrap">{currentMetric ? `${currentMetric.label} Progression (${currentMetric.unit})` : ''}</h4>
        <div className="w-full sm:w-56">
          <Label htmlFor="metric-select" className="sr-only">
            {t('selectMetric')}
          </Label>
          <Select id="metric-select" value={selectedMetric} onChange={(e) => onMetricChange(e.target.value)}>
            {metricList.map(({ key, label, unit }) => (
              <option key={key} value={key}>
                {label} ({unit})
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 1 ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">{t('notEnoughData')}</div>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
