import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '../../../states/stores/auth/authStore'
import { useStore } from '../../../states/stores/store'

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

  const handleGoToProfile = () => {
    setIsOpen(false)
    navigate('/settings')
  }

  const avatarSrc = user?.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.email || 'trainer')}`

  return (
    <div className="relative" data-testid="user-menu">
      <button data-testid="user-menu-toggle" onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors">
        <img src={avatarSrc} alt={t('profile')} className="h-8 w-8 rounded-full object-cover border border-slate-200" data-testid="user-menu-avatar" />
        <span className="hidden md:block text-sm font-medium text-slate-700">{user?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 text-sm text-slate-700 border-b">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>

          <button data-testid="user-menu-profile" onClick={handleGoToProfile} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <UserIcon className="mr-2 h-4 w-4 text-indigo-600" />
            {t('profile')}
          </button>

          <button
            data-testid="user-menu-logout"
            onClick={handleLogout}
            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  )
}
