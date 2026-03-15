import React from 'react'
import { cn } from '../../utils/cn'

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm', className)} {...props} />
)
