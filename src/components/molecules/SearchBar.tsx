import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../atoms/Input'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, className }) => (
  <div className={`relative flex-1 max-w-sm ${className ?? ''}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input placeholder={placeholder} className="pl-9" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
)
