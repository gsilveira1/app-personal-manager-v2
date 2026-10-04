import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const initI18n = vi.fn<() => Promise<void>>()

vi.mock('../i18n/index', () => ({ initI18n: () => initI18n() }))

import { useI18nBoot } from './useI18nBoot'

describe('useI18nBoot', () => {
  beforeEach(() => {
    initI18n.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is pending until the initialisation settles, then ready', async () => {
    initI18n.mockResolvedValue()

    const { result } = renderHook(() => useI18nBoot())

    expect(result.current.boot).toEqual({ status: 'pending' })
    await waitFor(() => expect(result.current.boot).toEqual({ status: 'ready' }))
  })

  it('reports a failure with its message and logs it', async () => {
    initI18n.mockRejectedValue(new Error('bad resources'))

    const { result } = renderHook(() => useI18nBoot())

    await waitFor(() => expect(result.current.boot).toEqual({ status: 'failed', message: 'bad resources' }))
    expect(console.error).toHaveBeenCalledWith('[i18n] Initialisation failed:', expect.any(Error))
  })

  it('retries after a failure', async () => {
    initI18n.mockRejectedValueOnce(new Error('bad resources')).mockResolvedValueOnce()

    const { result } = renderHook(() => useI18nBoot())
    await waitFor(() => expect(result.current.boot.status).toBe('failed'))

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.boot).toEqual({ status: 'ready' }))
    expect(initI18n).toHaveBeenCalledTimes(2)
  })
})
