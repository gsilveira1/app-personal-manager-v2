import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Leads } from '../views/leads/Leads'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function LeadsIsland() {
  return (
    <ProtectedPage>
      <Leads />
    </ProtectedPage>
  )
}
