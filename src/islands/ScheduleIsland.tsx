import { ProtectedPage } from '../components/templates/ProtectedPage'
import { Schedule } from '../views/schedules/Schedule'

/** Astro mounts this with `client:only="react"`; it is the whole React tree of its page. */
export default function ScheduleIsland() {
  return (
    <ProtectedPage>
      <Schedule />
    </ProtectedPage>
  )
}
