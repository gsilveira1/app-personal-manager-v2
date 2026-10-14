import { SetupWizardPage } from '../components/templates/SetupWizardPage'
import { SetupWizard } from '../views/setup-wizard/SetupWizard'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function SetupWizardIsland() {
  return (
    <SetupWizardPage>
      <SetupWizard />
    </SetupWizardPage>
  )
}
