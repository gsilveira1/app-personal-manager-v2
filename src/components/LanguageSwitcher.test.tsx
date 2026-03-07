import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageSwitcher } from './LanguageSwitcher'

// Mock react-i18next
const mockChangeLanguage = vi.fn()
let mockResolvedLanguage = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      get resolvedLanguage() {
        return mockResolvedLanguage
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

// Mock Zustand store
const mockUpdateLocale = vi.fn()

vi.mock('../store/store', () => ({
  useStore: (selector: (s: any) => any) => selector({ updateLocale: mockUpdateLocale }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolvedLanguage = 'en'
    mockChangeLanguage.mockResolvedValue(undefined)
    mockUpdateLocale.mockResolvedValue(undefined)
  })

  it('renders 3 language options', () => {
    render(<LanguageSwitcher />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    const labels = options.map((o) => o.textContent)
    expect(labels).toContain('English')
    expect(labels).toContain('Español')
    expect(labels).toContain('Português (BR)')
  })

  it('active language option has aria-current="true"', () => {
    mockResolvedLanguage = 'es'
    render(<LanguageSwitcher />)
    const esOption = screen.getByRole('option', { name: 'Español' })
    expect(esOption).toHaveAttribute('aria-current', 'true')
  })

  it('calls i18n.changeLanguage with selected code when selecting different language', async () => {
    mockResolvedLanguage = 'en'
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'pt-BR' } })
    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })
  })

  it('calls updateLocale with selected code when selecting different language', async () => {
    mockResolvedLanguage = 'en'
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'pt-BR' } })
    await waitFor(() => {
      expect(mockUpdateLocale).toHaveBeenCalledWith('pt-BR')
    })
  })

  it('does NOT call i18n.changeLanguage when selecting the same active language', () => {
    mockResolvedLanguage = 'en'
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'en' } })
    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it('does NOT call updateLocale when selecting the same active language', () => {
    mockResolvedLanguage = 'en'
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'en' } })
    expect(mockUpdateLocale).not.toHaveBeenCalled()
  })

  it('disables select while switching is in progress', async () => {
    // changeLanguage never resolves so isSwitching stays true
    mockChangeLanguage.mockReturnValue(new Promise(() => {}))
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    await waitFor(() => {
      expect(select).toBeDisabled()
    })
  })

  it('re-enables select after changeLanguage and updateLocale resolve', async () => {
    mockChangeLanguage.mockResolvedValue(undefined)
    mockUpdateLocale.mockResolvedValue(undefined)
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    await waitFor(() => {
      expect(select).not.toBeDisabled()
    })
  })

  it('re-enables select even if changeLanguage rejects', async () => {
    mockChangeLanguage.mockRejectedValue(new Error('i18n error'))
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    await waitFor(() => {
      expect(select).not.toBeDisabled()
    })
  })

  it('re-enables select even if updateLocale rejects', async () => {
    mockUpdateLocale.mockRejectedValue(new Error('API error'))
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    await waitFor(() => {
      expect(select).not.toBeDisabled()
    })
  })

  it('logs error containing "language" when updateLocale rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdateLocale.mockRejectedValue(new Error('500 Internal Server Error'))
    render(<LanguageSwitcher />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'es' } })
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('language'),
        expect.any(Error),
      )
    })
    consoleSpy.mockRestore()
  })
})
