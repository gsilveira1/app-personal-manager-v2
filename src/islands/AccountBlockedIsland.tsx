import { PublicPage } from '../components/templates/PublicPage'
import { AccountBlocked } from '../views/blocked/AccountBlocked'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function AccountBlockedIsland() {
  return (
    <PublicPage>
      <AccountBlocked />
    </PublicPage>
  )
}
