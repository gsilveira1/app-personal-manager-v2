import React from 'react'
import { Menu } from 'lucide-react'

import { LanguageSwitcher } from '../../LanguageSwitcher'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  onToggleSidebar: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar }) => (
  <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
    <button onClick={onToggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
      <Menu className="h-6 w-6" />
    </button>
    <div className="flex items-center ml-auto space-x-4">
      <LanguageSwitcher />
      <UserMenu />
    </div>
  </header>
)
