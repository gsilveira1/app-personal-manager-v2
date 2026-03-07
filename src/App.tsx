import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router'
import { HashRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Loader2, AlertTriangle } from 'lucide-react'
import { i18n } from './i18n/index'
import { useStore } from './store/store'
import { useAuthStore } from './store/authStore'

import { Layout } from './components/Layout'
import { Button } from './components/ui'
import { AuthLayout } from './components/AuthLayout'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { ClientDetails } from './pages/ClientDetails'
import { Schedule } from './pages/Schedule'
import { Workouts } from './pages/Workouts'
import { Settings } from './pages/Settings'
import { Leads } from './pages/Leads'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { ForgotPassword } from './pages/ForgotPassword'

const FullScreenLoader = ({ message }: { message: string }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p className="mt-4 text-sm font-medium">{message}</p>
  </div>
)

const FullScreenError = ({ message, onRetry }: { message: string | null; onRetry: () => void }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
    <div className="flex flex-col items-center text-center max-w-md">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-800">{i18n.t('appError.title')}</h1>
      <p className="mt-2 text-slate-600">{i18n.t('appError.message')}</p>
      {message && <p className="mt-4 text-sm text-red-700 bg-red-100 p-3 rounded-md">{message}</p>}
      <Button onClick={onRetry} className="mt-6">
        {i18n.t('appError.retry')}
      </Button>
    </div>
  </div>
)

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore()
  const { appState, errorMessage, fetchInitialData, clearDataOnLogout } = useStore()

  useEffect(() => {
    if (isAuthenticated) {
      if (appState === 'idle') {
        fetchInitialData()
      }
    } else {
      if (appState !== 'idle') {
        clearDataOnLogout()
      }
    }
  }, [isAuthenticated, appState, fetchInitialData, clearDataOnLogout])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (appState === 'loading' || appState === 'idle') {
    return <FullScreenLoader message={i18n.t('appLoading')} />
  }

  if (appState === 'error') {
    return <FullScreenError message={errorMessage} onRetry={fetchInitialData} />
  }

  return <Outlet />
}

function App() {
  const { checkAuthStatus, isLoading } = useAuthStore()
  const locale = useStore((s) => s.locale)

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Sync Zustand locale → i18n whenever the store's locale changes.
  // This is a defensive bridge: hydrateLocale already calls i18n.changeLanguage
  // directly, but this useEffect ensures the language is always applied even if
  // there are any React 18 concurrent-rendering timing edge cases.
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale])

  if (isLoading) {
    return <FullScreenLoader message={i18n.t('checkingSession')} />
  }

  return (
    <I18nextProvider i18n={i18n}>
      <HashRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="leads" element={<Leads />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </I18nextProvider>
  )
}

export default App
