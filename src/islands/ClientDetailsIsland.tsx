import { ProtectedPage } from '../components/templates/ProtectedPage'
import { ClientDetails } from '../views/client-details/ClientDetails'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function ClientDetailsIsland() {
  return (
    <ProtectedPage>
      <ClientDetails />
    </ProtectedPage>
  )
}
