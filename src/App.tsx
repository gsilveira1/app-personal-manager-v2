import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router'
import { HashRouter } from 'react-router-dom'
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
import { Dashboard } from './pages/dashboards/Dashboard'
import { Clients } from './pages/clients/Clients'
import { ClientDetails } from './pages/client-details/ClientDetails'
import { Schedule } from './pages/schedules/Schedule'
import { Workouts } from './pages/workouts/Workouts'
import { Settings } from './pages/settings/Settings'
import { Notifications } from './pages/notifications/Notifications'
import { Leads } from './pages/leads/Leads'
import { Login } from './pages/login/Login'

import { SignUp } from './pages/sign-up/SignUp'
import { ForgotPassword } from './pages/forgot-password/ForgotPassword'
import { ResetPassword } from './pages/reset-password/ResetPassword'
import { SetupWizard } from './pages/setup-wizard/SetupWizard'

import { AnamnesisForm } from './pages/anamnesis-form/AnamnesisForm'
import { WorkoutPlayer } from './pages/workout-player/WorkoutPlayer'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AccountBlocked } from './pages/blocked/AccountBlocked'

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

function App() {
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
      <HashRouter>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Setup Wizard Route */}
          <Route path="/setup-wizard" element={isAuthenticated ? <SetupWizard /> : <Navigate to="/login" replace />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="leads" element={<Leads />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsers />} />
              </Route>
              <Route path="admin/tenants" element={<Navigate to="/admin/users" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </I18nextProvider>
  )
}

export default App
