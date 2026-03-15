import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Dumbbell, X, Settings, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../../store/store'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { clients } = useStore()
  const { t } = useTranslation('navigation')
  const leadCount = clients.filter((c) => c.status === 'Lead').length

  type NavItem = { to: string; icon: React.ElementType; label: string; badge?: number }

  const navItems: NavItem[] = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/clients', icon: Users, label: t('clients') },
    { to: '/schedule', icon: Calendar, label: t('schedule') },
    { to: '/workouts', icon: Dumbbell, label: t('workouts') },
    { to: '/leads', icon: UserPlus, label: t('leads'), badge: leadCount > 0 ? leadCount : undefined },
    { to: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
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
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">{item.badge > 9 ? '9+' : item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
