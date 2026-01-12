
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Dumbbell, DollarSign, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { to: '/finances', icon: DollarSign, label: 'Finances' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
             <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PersonalMgr</span>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => window.innerWidth < 768 && onClose()}
            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Added min-w-0 to prevent flex items from breaking layout width */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-200 min-w-0">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center ml-auto space-x-4">
             <div className="flex items-center space-x-2">
                <img src="https://picsum.photos/32/32?random=99" alt="Profile" className="h-8 w-8 rounded-full border border-slate-200" />
                <span className="hidden md:block text-sm font-medium text-slate-700">Coach Alex</span>
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
