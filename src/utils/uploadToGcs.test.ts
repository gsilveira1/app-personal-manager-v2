import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadFileToGcs } from './uploadToGcs'

describe('uploadFileToGcs', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends PUT request with correct headers and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    await uploadFileToGcs('https://storage.example.com/signed-url', file)

    expect(mockFetch).toHaveBeenCalledWith('https://storage.example.com/signed-url', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: file,
    })
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    await expect(uploadFileToGcs('https://example.com/url', file)).rejects.toThrow('Upload falhou com status 403')
  })
})
