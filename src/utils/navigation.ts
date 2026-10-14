/**
 * Navigation without a client-side router. Every URL is an Astro page, so moving between
 * views is a document load; this module is the one place that touches `window.location`
 * so tests can mock it.
 */

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one (redirects, post-login). */
  replace?: boolean
}

/**
 * Loads another page of the app.
 *
 * @example
 * navigateTo(`/clients/${client.id}`)
 * navigateTo('/login', { replace: true })
 */
export type LocationTarget = Pick<Location, 'assign' | 'replace'>

export function navigateTo(path: string, options: NavigateOptions = {}, target: LocationTarget | null = globalLocation()): void {
  if (!target) return
  if (options.replace) target.replace(path)
  else target.assign(path)
}

const globalLocation = (): LocationTarget | null => (typeof window === 'undefined' ? null : window.location)

/** The current pathname, or `/` while rendering outside a browser. */
export function currentPathname(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname
}

/** Paths that all render the dashboard, so the dashboard link is active on any of them. */
const DASHBOARD_PATHS = new Set(['/', '/dashboard', '/dashboards'])

const stripTrailingSlash = (path: string): string => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path)

/**
 * Whether a navigation link points at the page being shown (or one of its sub-pages).
 *
 * @example
 * isActivePath('/clients', '/clients/42') // true
 * isActivePath('/', '/clients') // false
 */
export function isActivePath(href: string, pathname: string = currentPathname()): boolean {
  const current = stripTrailingSlash(pathname)
  if (DASHBOARD_PATHS.has(href)) return DASHBOARD_PATHS.has(current)
  const target = stripTrailingSlash(href)
  return current === target || current.startsWith(`${target}/`)
}

const segmentAfter = (prefix: string, pathname: string): string | null => {
  const match = new RegExp(`^${prefix}/([^/]+)/?$`).exec(pathname)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * The client id carried by a `/clients/:id` URL.
 *
 * @example
 * clientIdFromPath('/clients/2bd789b0') // '2bd789b0'
 */
export function clientIdFromPath(pathname: string = currentPathname()): string | null {
  return segmentAfter('/clients', pathname)
}

/**
 * The slug carried by a `/p/:slug` workout-player URL, when present.
 *
 * @example
 * workoutSlugFromPath('/p/viviana') // 'viviana'
 */
export function workoutSlugFromPath(pathname: string = currentPathname()): string | null {
  return segmentAfter('/p', pathname)
}
