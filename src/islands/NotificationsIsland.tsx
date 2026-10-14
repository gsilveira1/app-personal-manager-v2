import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Notifications } from '../views/notifications/Notifications'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function NotificationsIsland() {
  return (
    <ProtectedPage>
      <Notifications />
    </ProtectedPage>
  )
}
