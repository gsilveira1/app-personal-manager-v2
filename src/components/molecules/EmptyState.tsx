import React from 'react'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div className={`flex flex-col items-center justify-center py-12 text-slate-400 ${className ?? ''}`}>
    <div className="bg-slate-100 p-5 rounded-full mb-4">
      <Icon className="h-10 w-10 text-slate-300" />
    </div>
    <p className="text-lg font-semibold text-slate-600">{title}</p>
    {description && <p className="text-sm mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
