import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppFeaturesConfigSection } from './AppFeaturesConfigSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('AppFeaturesConfigSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders initial state with default configuration when localStorage is empty', () => {
    render(<AppFeaturesConfigSection />)

    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()

    const aiToggle = screen.getByTestId('toggle-enableAiAssistant')
    const feedbackToggle = screen.getByTestId('toggle-enableWorkoutFeedback')
    const bookingToggle = screen.getByTestId('toggle-enableOnlineBooking')
    const postureToggle = screen.getByTestId('toggle-enablePostureAnalysis')

    expect(aiToggle).toHaveAttribute('aria-checked', 'true')
    expect(feedbackToggle).toHaveAttribute('aria-checked', 'true')
    expect(bookingToggle).toHaveAttribute('aria-checked', 'true')
    expect(postureToggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders initial state loaded from localStorage when present', () => {
    const customConfig = {
      enableAiAssistant: false,
      enableWorkoutFeedback: false,
      enableOnlineBooking: false,
      enablePostureAnalysis: true,
    }
    localStorage.setItem('trainer_app_features_config', JSON.stringify(customConfig))

    render(<AppFeaturesConfigSection />)

    expect(screen.getByTestId('toggle-enableAiAssistant')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByTestId('toggle-enableWorkoutFeedback')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByTestId('toggle-enableOnlineBooking')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByTestId('toggle-enablePostureAnalysis')).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles feature switches when clicked directly', () => {
    render(<AppFeaturesConfigSection />)

    const postureToggle = screen.getByTestId('toggle-enablePostureAnalysis')
    expect(postureToggle).toHaveAttribute('aria-checked', 'false')

    act(() => {
      fireEvent.click(postureToggle)
    })
    expect(postureToggle).toHaveAttribute('aria-checked', 'true')

    const aiToggle = screen.getByTestId('toggle-enableAiAssistant')
    expect(aiToggle).toHaveAttribute('aria-checked', 'true')

    act(() => {
      fireEvent.click(aiToggle)
    })
    expect(aiToggle).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles feature switches when clicking the feature card wrapper', () => {
    render(<AppFeaturesConfigSection />)

    const feedbackCard = screen.getByTestId('feature-card-enableWorkoutFeedback')
    const feedbackToggle = screen.getByTestId('toggle-enableWorkoutFeedback')
    expect(feedbackToggle).toHaveAttribute('aria-checked', 'true')

    act(() => {
      fireEvent.click(feedbackCard)
    })
    expect(feedbackToggle).toHaveAttribute('aria-checked', 'false')

    const bookingCard = screen.getByTestId('feature-card-enableOnlineBooking')
    const bookingToggle = screen.getByTestId('toggle-enableOnlineBooking')
    expect(bookingToggle).toHaveAttribute('aria-checked', 'true')

    act(() => {
      fireEvent.click(bookingCard)
    })
    expect(bookingToggle).toHaveAttribute('aria-checked', 'false')
  })

  it('submits the form, saves to localStorage, and displays then auto-hides success message feedback', async () => {
    render(<AppFeaturesConfigSection />)

    // Toggle posture analysis ON and ai OFF
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-enablePostureAnalysis'))
      fireEvent.click(screen.getByTestId('toggle-enableAiAssistant'))
    })

    const saveBtn = screen.getByTestId('save-app-features-btn')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // Submit form
    act(() => {
      fireEvent.click(saveBtn)
    })

    expect(saveBtn).toBeDisabled()

    // Fast-forward save delay (400ms)
    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Saved to localStorage
    const saved = JSON.parse(localStorage.getItem('trainer_app_features_config') || '{}')
    expect(saved).toEqual({
      enableAiAssistant: false,
      enableWorkoutFeedback: true,
      enableOnlineBooking: true,
      enablePostureAnalysis: true,
    })

    // Feedback alert shown
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('settingsSaved')).toBeInTheDocument()
    expect(saveBtn).not.toBeDisabled()

    // Fast-forward feedback timeout (3000ms)
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Feedback alert disappears
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
