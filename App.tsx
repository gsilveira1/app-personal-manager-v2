import React, { useEffect } from 'react';
// FIX: Split react-router-dom imports to fix module resolution errors.
import { Routes, Route, Navigate, Outlet } from 'react-router';
import { HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetails } from './pages/ClientDetails';
import { Schedule } from './pages/Schedule';
import { Workouts } from './pages/Workouts';
import { Finances } from './pages/Finances';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { useAuthStore } from './store/authStore';
import { useStore } from './store';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from './components/ui';

const FullScreenLoader = ({ message }: { message: string }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p className="mt-4 text-sm font-medium">{message}</p>
  </div>
);

const FullScreenError = ({ message, onRetry }: { message: string | null, onRetry: () => void }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
            <p className="mt-2 text-slate-600">
                We couldn't load the application data. Please check your connection and try again.
            </p>
            {message && <p className="mt-4 text-sm text-red-700 bg-red-100 p-3 rounded-md">{message}</p>}
            <Button onClick={onRetry} className="mt-6">
                Try Again
            </Button>
        </div>
    </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const { appState, errorMessage, fetchInitialData, clearDataOnLogout } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (appState === 'idle') {
        fetchInitialData();
      }
    } else {
      if (appState !== 'idle') {
        clearDataOnLogout();
      }
    }
  }, [isAuthenticated, appState, fetchInitialData, clearDataOnLogout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (appState === 'loading' || appState === 'idle') {
     return <FullScreenLoader message="Loading your dashboard..." />;
  }

  if (appState === 'error') {
     return <FullScreenError message={errorMessage} onRetry={fetchInitialData} />;
  }
  
  return <Outlet />;
};

function App() {
  const { checkAuthStatus, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (isLoading) {
    return (
      <FullScreenLoader message="Checking session..." />
    );
  }

  return (
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
            <Route path="finances" element={<Finances />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
