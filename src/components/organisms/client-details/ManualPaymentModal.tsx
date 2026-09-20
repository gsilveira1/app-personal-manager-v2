import { useState } from 'react'
import { DollarSign, Calendar, FileText, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Input, Label } from '../../atoms'
import type { Client } from '../../../types'

interface ManualPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  onSave: (paymentData: { paymentType: string; validUntil: string; notes?: string; amount?: number }) => Promise<void>
}

export const ManualPaymentModal = ({ isOpen, onClose, client, onSave }: ManualPaymentModalProps) => {
  const { t } = useTranslation('clients')
  const [paymentType, setPaymentType] = useState<'MANUAL_PIX' | 'MANUAL_CASH' | 'MANUAL_CARD'>('MANUAL_PIX')
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split('T')[0]
  })
  const [amount, setAmount] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave({
        paymentType,
        validUntil: new Date(`${validUntil}T23:59:59.000Z`).toISOString(),
        notes: notes || undefined,
        amount: amount ? parseFloat(amount) : undefined,
      })
      onClose()
    } catch (error) {
      console.error('Error saving manual payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md overflow-hidden bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="flex items-center text-lg font-bold text-slate-900">
            <DollarSign className="mr-2 h-5 w-5 text-emerald-600" />
            {t('manualPayment.title', 'Registrar Pagamento Manual')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('manualPayment.subtitle', 'Renovação de acesso para')} <strong className="text-slate-800">{client.name}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">
              {t('manualPayment.method', 'Forma de Pagamento')}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MANUAL_PIX', label: 'Pix' },
                { id: 'MANUAL_CASH', label: 'Dinheiro' },
                { id: 'MANUAL_CARD', label: 'Cartão' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentType(m.id as any)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    paymentType === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="validUntil" className="mb-1 block text-xs font-semibold text-slate-700">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              {t('manualPayment.validUntil', 'Novo Vencimento')}
            </Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
              className="w-full text-sm"
            />
          </div>

          <div>
            <Label htmlFor="amount" className="mb-1 block text-xs font-semibold text-slate-700">
              {t('manualPayment.amount', 'Valor Pago (R$) (Opcional)')}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="mb-1 block text-xs font-semibold text-slate-700">
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              {t('manualPayment.notes', 'Observações')}
            </Label>
            <Input
              id="notes"
              placeholder="Ex: Pago adiantado em dinheiro"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="mr-1.5 h-4 w-4" />
              {isLoading ? t('common.saving', 'Salvando...') : t('manualPayment.confirm', 'Confirmar Baixa')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
