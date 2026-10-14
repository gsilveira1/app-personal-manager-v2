import { ProtectedPage } from '../components/templates/ProtectedPage'
import { AiSettings } from '../views/ai/AiSettings'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function AiSettingsIsland() {
  return (
    <ProtectedPage>
      <AiSettings />
    </ProtectedPage>
  )
}
