import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <Loader2 className={cn('animate-spin text-slate-500', className)} size={size} />
)
