import React from 'react';
// FIX: Split react-router-dom import to fix module resolution errors.
import { Outlet } from 'react-router';
import { Dumbbell } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center space-x-2 mb-8">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-800">PersonalMgr</span>
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
};