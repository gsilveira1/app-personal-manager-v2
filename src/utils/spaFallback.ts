/**
 * URLs that carry a dynamic segment, mapped to the static page whose island reads that
 * segment from the pathname. Astro cannot prerender unknown ids, so nginx rewrites these in
 * production (docker/nginx/default.conf.template) and the Astro dev server does the same
 * (see astro.config.mjs). Keep both lists identical; spaFallback.test.ts checks the nginx one.
 */
export const DYNAMIC_ROUTES: Array<{ pattern: RegExp; page: string }> = [
  { pattern: /^\/p\/[^/.]+\/?$/, page: '/workout-player' },
  { pattern: /^\/clients\/[^/.]+\/?$/, page: '/client-details' },
]

/**
 * The static page to serve for a dynamic-segment path, or null when the path is a real page or asset.
 *
 * @example
 * spaFallbackPath('/p/viviana') // '/workout-player'
 */
export function spaFallbackPath(pathname: string): string | null {
  return DYNAMIC_ROUTES.find(({ pattern }) => pattern.test(pathname))?.page ?? null
}

/**
 * Links sent while the app used a hash router look like `/#/p/slug?token=…`.
 * Returns the equivalent path (with its query), or null for an ordinary fragment.
 *
 * @example
 * legacyHashPath('#/anamnesis?token=abc') // '/anamnesis?token=abc'
 */
export function legacyHashPath(hash: string): string | null {
  if (!hash.startsWith('#/') || hash.startsWith('#//')) return null
  return hash.slice(1)
}
