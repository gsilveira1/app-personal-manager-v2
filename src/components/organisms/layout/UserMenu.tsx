import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '../../../store/authStore'
import { useStore } from '../../../store/store'

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { clearDataOnLogout } = useStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')

  const handleLogout = async () => {
    await logout()
    clearDataOnLogout()
    navigate('/login')
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100">
        <img src={`https://i.pravatar.cc/150?u=${user?.email}`} alt={t('profile')} className="h-8 w-8 rounded-full border border-slate-200" />
        <span className="hidden md:block text-sm font-medium text-slate-700">{user?.name}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 text-sm text-slate-700 border-b">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <LogOut className="mr-2 h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  )
}
