import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../atoms'

export const FullScreenLoader = ({ message }: { message: string }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500" data-testid="full-screen-loader">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p className="mt-4 text-sm font-medium">{message}</p>
  </div>
)

export interface FullScreenErrorProps {
  /** Technical detail shown under the explanation; null hides the box. */
  message: string | null
  onRetry: () => void
  texts: { title: string; message: string; retry: string }
}

export const FullScreenError = ({ message, onRetry, texts }: FullScreenErrorProps) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4" data-testid="full-screen-error">
    <div className="flex flex-col items-center text-center max-w-md">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-800">{texts.title}</h1>
      <p className="mt-2 text-slate-600">{texts.message}</p>
      {message && <p className="mt-4 text-sm text-red-700 bg-red-100 p-3 rounded-md">{message}</p>}
      <Button onClick={onRetry} className="mt-6">
        {texts.retry}
      </Button>
    </div>
  </div>
)
