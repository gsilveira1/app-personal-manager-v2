/**
 * Magic links arrive as absolute URLs (`${FRONTEND_URL}/#/...`). A relative one is
 * resolved against the current origin so it can still be copied and shared.
 */
export const toAbsoluteLink = (link: string, origin: string = window.location.origin): string => (/^https?:\/\//i.test(link) ? link : `${origin}${link.startsWith('/') ? '' : '/'}${link}`)
