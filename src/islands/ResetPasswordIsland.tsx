import { AuthPage } from '../components/templates/AuthPage'
import { ResetPassword } from '../views/reset-password/ResetPassword'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function ResetPasswordIsland() {
  return (
    <AuthPage>
      <ResetPassword />
    </AuthPage>
  )
}
