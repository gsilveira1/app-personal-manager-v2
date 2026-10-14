import { ProtectedPage } from '../components/templates/ProtectedPage'
import { AdminUsers } from '../views/admin/AdminUsers'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function AdminUsersIsland() {
  return (
    <ProtectedPage requireAdmin>
      <AdminUsers />
    </ProtectedPage>
  )
}
