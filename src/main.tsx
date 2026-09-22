import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initI18n } from './i18n/index'

// Automatically normalize direct / non-hash deep links (e.g. /p/:slug, /anamnesis, /reset-password)
if (typeof window !== 'undefined') {
  const { pathname, search, hash } = window.location
  if (!hash && (pathname.startsWith('/p/') || pathname.startsWith('/anamnesis') || pathname.startsWith('/reset-password') || pathname.startsWith('/workout-player'))) {
    window.location.replace(`/#${pathname}${search}`)
  }
}

initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
