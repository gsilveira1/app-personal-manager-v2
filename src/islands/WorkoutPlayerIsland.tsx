import { PublicPage } from '../components/templates/PublicPage'
import { WorkoutPlayer } from '../views/workout-player/WorkoutPlayer'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function WorkoutPlayerIsland() {
  return (
    <PublicPage>
      <WorkoutPlayer />
    </PublicPage>
  )
}
