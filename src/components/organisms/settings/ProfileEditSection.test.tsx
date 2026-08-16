import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUser = {
  id: 'trainer-1',
  name: 'Carlos Trainer',
  email: 'carlos@trainer.com',
  role: 'trainer',
  avatar: 'https://storage.googleapis.com/bucket/avatars/trainer-1.png',
  phone: '5551999999999',
  bio: 'Especialista em musculação',
}

const mockUpdateProfile = vi.fn().mockResolvedValue(undefined)
const mockUploadAvatar = vi.fn().mockResolvedValue(undefined)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../../states/stores/auth/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    updateProfile: mockUpdateProfile,
    uploadAvatar: mockUploadAvatar,
  }),
}))

import { ProfileEditSection } from './ProfileEditSection'
import { AppFeaturesConfigSection } from './AppFeaturesConfigSection'

describe('ProfileEditSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trainer profile information and avatar', () => {
    render(<ProfileEditSection />)

    expect(screen.getByTestId('profile-edit-section')).toBeInTheDocument()
    expect(screen.getByTestId('trainer-avatar-img')).toHaveAttribute('src', mockUser.avatar)
    expect(screen.getByTestId('profile-name-input')).toHaveValue(mockUser.name)
    expect(screen.getByTestId('profile-email-input')).toHaveValue(mockUser.email)
    expect(screen.getByTestId('profile-phone-input')).toHaveValue(mockUser.phone)
    expect(screen.getByTestId('profile-bio-textarea')).toHaveValue(mockUser.bio)
  })

  it('submits form to update profile details', async () => {
    const user = userEvent.setup()
    render(<ProfileEditSection />)

    const nameInput = screen.getByTestId('profile-name-input')
    await user.clear(nameInput)
    await user.type(nameInput, 'Carlos Silva')

    const saveBtn = screen.getByTestId('save-profile-btn')
    await user.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Carlos Silva',
        email: 'carlos@trainer.com',
        phone: '5551999999999',
        bio: 'Especialista em musculação',
      })
    })
  })

  it('handles avatar file upload selection', async () => {
    render(<ProfileEditSection />)

    const fileInput = screen.getByTestId('avatar-file-input')
    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file)
    })
  })
})

describe('AppFeaturesConfigSection', () => {
  it('renders app features toggles and allows saving configuration', async () => {
    const user = userEvent.setup()
    render(<AppFeaturesConfigSection />)

    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-enableAiAssistant')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-enableWorkoutFeedback')).toBeInTheDocument()

    const toggleBtn = screen.getByTestId('toggle-enablePostureAnalysis')
    await user.click(toggleBtn)

    const saveBtn = screen.getByTestId('save-app-features-btn')
    await user.click(saveBtn)

    await waitFor(() => {
      const savedConfig = JSON.parse(localStorage.getItem('trainer_app_features_config') || '{}')
      expect(savedConfig.enablePostureAnalysis).toBe(true)
    })
  })
})
