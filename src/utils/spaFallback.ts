/**
 * Routes that exist only in the client-side router (they carry a dynamic segment),
 * mapped to the static page that mounts the router. Nginx falls back to index.html
 * in production; the Astro dev server needs the same rewrite (see astro.config.mjs).
 */
const DYNAMIC_ROUTES: Array<{ pattern: RegExp; page: string }> = [
  { pattern: /^\/p\/[^/.]+\/?$/, page: '/workout-player' },
  { pattern: /^\/clients\/[^/.]+\/?$/, page: '/client-details' },
]

/**
 * The static page to serve for a router-only path, or null when the path is a real page or asset.
 *
 * @example
 * spaFallbackPath('/p/viviana') // '/workout-player'
 */
export function spaFallbackPath(pathname: string): string | null {
  return DYNAMIC_ROUTES.find(({ pattern }) => pattern.test(pathname))?.page ?? null
}

/**
 * Links sent before the move to BrowserRouter look like `/#/p/slug?token=…`.
 * Returns the equivalent path (with its query), or null for an ordinary fragment.
 *
 * @example
 * legacyHashPath('#/anamnesis?token=abc') // '/anamnesis?token=abc'
 */
export function legacyHashPath(hash: string): string | null {
  if (!hash.startsWith('#/') || hash.startsWith('#//')) return null
  return hash.slice(1)
}
