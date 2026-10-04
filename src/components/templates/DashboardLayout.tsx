import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '../organisms/layout/Sidebar'
import { AppHeader } from '../organisms/layout/AppHeader'

export const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-200 min-w-0">
        <AppHeader onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">{children ?? <Outlet />}</div>
        </main>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
