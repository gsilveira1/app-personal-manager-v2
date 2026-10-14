import { AuthPage } from '../components/templates/AuthPage'
import { Login } from '../views/login/Login'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function LoginIsland() {
  return (
    <AuthPage>
      <Login />
    </AuthPage>
  )
}
