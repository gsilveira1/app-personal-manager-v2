import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetails } from './pages/ClientDetails';
import { Schedule } from './pages/Schedule';
import { Workouts } from './pages/Workouts';
import { Finances } from './pages/Finances';
import { Settings } from './pages/Settings';
import { useStore } from './store';
import { Loader2 } from 'lucide-react';

function App() {
  const { fetchInitialData, isInitialized } = useStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetails />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="finances" element={<Finances />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;