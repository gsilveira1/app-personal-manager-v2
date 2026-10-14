import { PublicPage } from '../components/templates/PublicPage'
import { AnamnesisForm } from '../views/anamnesis-form/AnamnesisForm'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function AnamnesisFormIsland() {
  return (
    <PublicPage>
      <AnamnesisForm />
    </PublicPage>
  )
}
