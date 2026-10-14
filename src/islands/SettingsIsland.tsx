import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Settings } from '../views/settings/Settings'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function SettingsIsland() {
  return (
    <ProtectedPage>
      <Settings />
    </ProtectedPage>
  )
}
