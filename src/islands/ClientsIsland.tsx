import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Clients } from '../views/clients/Clients'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function ClientsIsland() {
  return (
    <ProtectedPage>
      <Clients />
    </ProtectedPage>
  )
}
