import React from 'react'
import { Label } from '../atoms/Label'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, error, hint, children, className }) => (
  <div className={`space-y-2 ${className ?? ''}`}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
)
