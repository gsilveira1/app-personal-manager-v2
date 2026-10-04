import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Loader2, AlertTriangle } from 'lucide-react'
import { i18n } from './i18n/index'
import { useStore } from './states/stores/store'
import { useAuthStore } from './states/stores/auth/authStore'

import { Layout } from './components/Layout'
import { Button } from './components/ui'
import { AuthLayout } from './components/AuthLayout'
import { AdminRoute } from './components/AdminRoute'
import { resolveAccountGate } from './utils/accountGate'
import { Dashboard } from './views/dashboards/Dashboard'
import { Clients } from './views/clients/Clients'
import { ClientDetails } from './views/client-details/ClientDetails'
import { Schedule } from './views/schedules/Schedule'
import { Workouts } from './views/workouts/Workouts'
import { Settings } from './views/settings/Settings'
import { Notifications } from './views/notifications/Notifications'
import { Leads } from './views/leads/Leads'
import { Login } from './views/login/Login'

import { SignUp } from './views/sign-up/SignUp'
import { ForgotPassword } from './views/forgot-password/ForgotPassword'
import { ResetPassword } from './views/reset-password/ResetPassword'
import { SetupWizard } from './views/setup-wizard/SetupWizard'

import { AnamnesisForm } from './views/anamnesis-form/AnamnesisForm'
import { WorkoutPlayer } from './views/workout-player/WorkoutPlayer'
import { AdminUsers } from './views/admin/AdminUsers'
import { AccountBlocked } from './views/blocked/AccountBlocked'
import { legacyHashPath } from './utils/spaFallback'

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
  const { isAuthenticated, user } = useAuthStore()
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

  // Feature 008 / 001 guardrails: blocked or overdue account, then mandatory setup wizard
  const gate = resolveAccountGate(user)
  if (gate === 'blocked') return <Navigate to="/blocked" replace />
  if (gate === 'setup') return <Navigate to="/setup-wizard" replace />

  if (appState === 'loading' || appState === 'idle') {
    return <FullScreenLoader message={i18n.t('appLoading')} />
  }

  if (appState === 'error') {
    return <FullScreenError message={errorMessage} onRetry={fetchInitialData} />
  }

  return <Outlet />
}

// Links sent before the move to BrowserRouter (`/#/p/slug?token=…`) must keep working.
function adoptLegacyHashLink() {
  if (typeof window === 'undefined') return
  const path = legacyHashPath(window.location.hash)
  if (path) window.history.replaceState(null, '', path)
}

function App() {
  adoptLegacyHashLink()
  const { checkAuthStatus, isLoading, isAuthenticated } = useAuthStore()
  const locale = useStore((s) => s.locale)

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

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
      <BrowserRouter>
        <Routes>
          {/* Public Student Magic Link Routes */}
          <Route path="/anamnesis" element={<AnamnesisForm />} />
          <Route path="/p/:slug" element={<WorkoutPlayer />} />
          <Route path="/workout-player" element={<WorkoutPlayer />} />
          <Route path="/blocked" element={<AccountBlocked />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Setup Wizard Route */}
          <Route path="/setup-wizard" element={isAuthenticated ? <SetupWizard /> : <Navigate to="/login" replace />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboards" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="schedules" element={<Schedule />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="leads" element={<Leads />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin" element={<AdminUsers />} />
              </Route>
              <Route path="admin/tenants" element={<Navigate to="/admin/users" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nextProvider>
  )
}

export default App
