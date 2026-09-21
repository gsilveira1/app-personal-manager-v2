import { AlertOctagon, Phone } from 'lucide-react'
import { Card } from '../../components/atoms'

export const TenantBlocked = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <Card className="max-w-md w-full p-8 text-center bg-slate-900 border-slate-800 shadow-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 ring-8 ring-red-500/10">
          <AlertOctagon className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">Plataforma Temporariamente Indisponível</h1>
          <p className="text-sm text-slate-400 mt-2">O acesso a este serviço foi suspenso temporariamente. Por favor, entre em contato com seu treinador para regularização.</p>
        </div>

        <div className="pt-2">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            <Phone className="h-4 w-4" />
            Contatar Suporte / Treinador
          </a>
        </div>
      </Card>
    </div>
  )
}
