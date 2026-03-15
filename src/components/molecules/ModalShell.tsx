import React from 'react'
import { X } from 'lucide-react'
import { Card } from '../atoms/Card'
import { Button } from '../atoms/Button'

interface ModalShellProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  className?: string
}

export const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children, maxWidth = 'max-w-md', className }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <Card className={`w-full ${maxWidth} bg-white shadow-xl animate-in fade-in zoom-in duration-200 ${className ?? ''}`}>
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <Button variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      {children}
    </Card>
  </div>
)
