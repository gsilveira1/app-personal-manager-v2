import { AuthPage } from '../components/templates/AuthPage'
import { ForgotPassword } from '../views/forgot-password/ForgotPassword'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function ForgotPasswordIsland() {
  return (
    <AuthPage>
      <ForgotPassword />
    </AuthPage>
  )
}
