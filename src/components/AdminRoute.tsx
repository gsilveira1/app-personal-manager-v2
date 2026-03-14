import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../store/authStore'

export const AdminRoute = () => {
  const { user } = useAuthStore()

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
