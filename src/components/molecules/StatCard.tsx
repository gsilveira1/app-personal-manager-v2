import React from 'react'
import { Card } from '../atoms/Card'

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  description: string
  isAlert?: boolean
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, isAlert }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${isAlert ? 'bg-red-100' : 'bg-slate-100'}`}>
        <Icon className={`h-5 w-5 ${isAlert ? 'text-red-600' : 'text-slate-600'}`} />
      </div>
    </div>
    <div className="mt-2">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
    <p className={`mt-3 text-xs ${isAlert ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{description}</p>
  </Card>
)
