import { useCallback, useEffect, useState } from 'react'

export type SearchParamsUpdater = URLSearchParams | ((current: URLSearchParams) => URLSearchParams)

const readSearchParams = (): URLSearchParams => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)

/**
 * The page's query string as state. Writing pushes a history entry so the browser's back
 * button undoes it, and `popstate` keeps the state in sync with that button.
 *
 * @example
 * const [params, setParams] = useUrlSearchParams()
 * setParams((current) => { const next = new URLSearchParams(current); next.set('tab', 'whatsapp'); return next })
 */
export function useUrlSearchParams(): [URLSearchParams, (update: SearchParamsUpdater) => void] {
  const [params, setParams] = useState<URLSearchParams>(readSearchParams)

  useEffect(() => {
    const sync = () => setParams(readSearchParams())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const update = useCallback((updater: SearchParamsUpdater) => {
    const next = typeof updater === 'function' ? updater(readSearchParams()) : updater
    const query = next.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.pushState(null, '', url)
    setParams(new URLSearchParams(query))
  }, [])

  return [params, update]
}
