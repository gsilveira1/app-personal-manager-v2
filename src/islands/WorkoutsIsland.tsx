import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Workouts } from '../views/workouts/Workouts'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function WorkoutsIsland() {
  return (
    <ProtectedPage>
      <Workouts />
    </ProtectedPage>
  )
}
