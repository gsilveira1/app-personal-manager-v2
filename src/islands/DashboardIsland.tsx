import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Dashboard } from '../views/dashboards/Dashboard'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function DashboardIsland() {
  return (
    <ProtectedPage>
      <Dashboard />
    </ProtectedPage>
  )
}
