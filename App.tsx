import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchInitialData } = useStore();
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      fetchInitialData().finally(() => setIsLoadingData(false));
    }
  }, [isAuthenticated, fetchInitialData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (isLoadingData) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm font-medium">Checking session...</p>
      </div>
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