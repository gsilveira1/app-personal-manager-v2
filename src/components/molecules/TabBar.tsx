import React from 'react'

interface TabBarProps<T extends string> {
  tabs: { id: T; label: string; icon?: React.ElementType }[]
  activeTab: T
  onChange: (tab: T) => void
  className?: string
  /** Accessible name of the tab list, announced by screen readers. */
  ariaLabel?: string
}

export function TabBar<T extends string>({ tabs, activeTab, onChange, className, ariaLabel }: TabBarProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={`flex max-w-full overflow-x-auto bg-slate-100 p-1 rounded-lg ${className ?? ''}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center shrink-0 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
