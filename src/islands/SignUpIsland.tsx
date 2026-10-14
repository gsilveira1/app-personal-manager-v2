import { AuthPage } from '../components/templates/AuthPage'
import { SignUp } from '../views/sign-up/SignUp'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function SignUpIsland() {
  return (
    <AuthPage>
      <SignUp />
    </AuthPage>
  )
}
