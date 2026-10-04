import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { downloadClientsCsv, getExportCsvUrl } from './clientApi'

describe('downloadClientsCsv', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'jwt-1')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches /clients/export/csv with the bearer token and returns the file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('name,email\nMaria,maria@test.com', { status: 200, headers: { 'Content-Type': 'text/csv' } }))
    vi.stubGlobal('fetch', fetchMock)

    const blob = await downloadClientsCsv()

    expect(fetchMock).toHaveBeenCalledWith(getExportCsvUrl(), { headers: { Authorization: 'Bearer jwt-1' } })
    expect(getExportCsvUrl()).toMatch(/\/clients\/export\/csv$/)
    expect(await blob.text()).toContain('Maria')
  })

  it('fails with the HTTP status instead of handing back an error page as a file', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })))

    await expect(downloadClientsCsv()).rejects.toMatchObject({ name: 'ApiError', status: 401 })
  })

  it('reports a network failure as an ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(downloadClientsCsv()).rejects.toMatchObject({ name: 'ApiError', status: 0 })
  })
})
