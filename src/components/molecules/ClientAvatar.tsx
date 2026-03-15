import React from 'react'
import { cn } from '../../utils/cn'

interface ClientAvatarProps {
  name: string
  avatar?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ name, avatar, size = 'md', className }) => {
  if (avatar) {
    return <img src={avatar} alt={name} className={cn('rounded-full object-cover', sizeMap[size], className)} />
  }

  return (
    <div className={cn('rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0', sizeMap[size], className)}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
