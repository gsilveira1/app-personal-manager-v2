import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../states/stores/auth/authStore'

export const AdminRoute = () => {
  const { user } = useAuthStore()

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
