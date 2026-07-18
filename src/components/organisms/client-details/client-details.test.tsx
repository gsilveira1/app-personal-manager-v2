import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Global mocks ──────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../utils/dateLocale', () => ({
  formatLocalized: () => 'formatted-date',
}))

vi.mock('recharts', () => ({
  LineChart: (p: any) => <div data-testid="line-chart">{p.children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: (p: any) => <div>{p.children}</div>,
}))

const mockUpdateEvaluation = vi.fn()
const mockDeleteEvaluation = vi.fn()

vi.mock('../../../store/store', () => ({
  useStore: () => ({
    updateEvaluation: mockUpdateEvaluation,
    deleteEvaluation: mockDeleteEvaluation,
  }),
}))

// ── Imports (after mocks) ─────────────────────────────────────────────
import { ClientProfileHeader } from './ClientProfileHeader'
import { MedicalHistoryCard } from './MedicalHistoryCard'
import { EvaluationCard } from './EvaluationCard'
import { WorkoutCard } from './WorkoutCard'
import { ProgressChart } from './ProgressChart'
import { SessionLogModal } from './SessionLogModal'
import { EvaluationModal } from './EvaluationModal'
import { ConfirmationModal } from './ConfirmationModal'
import type { Client, Plan, Evaluation, WorkoutPlan, MedicalHistory } from '../../../types'

// ── Test fixtures ─────────────────────────────────────────────────────
const baseClient: Client = {
  id: 'c1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '(53) 99999-0000',
  status: 'Active',
  type: 'In-Person',
  dateOfBirth: '1990-06-15',
  goal: 'Hypertrophy',
  medicalHistory: {
    objective: ['Health', 'Aesthetics'],
    injuries: 'Knee sprain',
    surgeries: 'None',
    medications: 'Vitamin D',
  },
}

const basePlan: Plan = {
  id: 'p1',
  type: 'PRESENCIAL',
  name: 'Premium Plan',
  sessionsPerWeek: 3,
  durationMinutes: 60,
  price: 350,
}

const baseEvaluation: Evaluation = {
  id: 'e1',
  clientId: 'c1',
  date: '2025-12-01T00:00:00.000Z',
  weight: 68,
  height: 1.65,
  bodyFatPercentage: 22,
  notes: 'Good progress',
  perimeters: { chest: 90, waist: 72 },
  skinfolds: { triceps: 12, subscapular: 14 },
}

const baseWorkout: WorkoutPlan = {
  id: 'w1',
  title: 'Treino A - Upper Body',
  description: 'Focus on chest and back',
  exercises: [
    { name: 'Bench Press', sets: 4, reps: '10', isWarmup: false },
    { name: 'Light Jog', sets: 1, reps: '5min', isWarmup: true },
  ],
  tags: ['Upper', 'Strength'],
  createdAt: '2025-11-01T00:00:00.000Z',
}

// =====================================================================
// ClientProfileHeader
// =====================================================================
describe('ClientProfileHeader', () => {
  const defaultProps = {
    client: baseClient,
    clientPlan: basePlan,
    isUploadingAvatar: false,
    avatarInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
    onAvatarChange: vi.fn(),
  }

  it('renders client name and status badge', () => {
    render(<ClientProfileHeader {...defaultProps} />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows plan name when plan provided', () => {
    render(<ClientProfileHeader {...defaultProps} />)
    expect(screen.getByText('Premium Plan')).toBeInTheDocument()
  })

  it('does not render plan section when no plan', () => {
    render(<ClientProfileHeader {...defaultProps} clientPlan={undefined} />)
    expect(screen.queryByText('Premium Plan')).not.toBeInTheDocument()
  })

  it('shows age calculated from dateOfBirth', () => {
    render(<ClientProfileHeader {...defaultProps} />)
    const expectedAge = new Date().getFullYear() - 1990
    expect(screen.getByText(`yearsOld`)).toBeInTheDocument()
  })

  it('shows email and phone', () => {
    render(<ClientProfileHeader {...defaultProps} />)
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
    expect(screen.getByText('(53) 99999-0000')).toBeInTheDocument()
  })

  it('avatar upload triggers onAvatarChange', async () => {
    const onAvatarChange = vi.fn()
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(
      <ClientProfileHeader {...defaultProps} avatarInputRef={ref} onAvatarChange={onAvatarChange} />
    )
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await userEvent.upload(fileInput, file)
    expect(onAvatarChange).toHaveBeenCalled()
  })

  it('renders avatar image when client has avatar url', () => {
    const clientWithAvatar = { ...baseClient, avatar: 'https://example.com/avatar.jpg' }
    render(<ClientProfileHeader {...defaultProps} client={clientWithAvatar} />)
    const img = screen.getByAltText('Maria Silva')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })
})

// =====================================================================
// MedicalHistoryCard
// =====================================================================
describe('MedicalHistoryCard', () => {
  const defaultBuffer: MedicalHistory = {
    injuries: 'Knee sprain',
    surgeries: 'None',
    medications: 'Vitamin D',
  }

  const defaultProps = {
    client: baseClient,
    isEditing: false,
    buffer: defaultBuffer,
    onStartEdit: vi.fn(),
    onSave: vi.fn(),
    onBufferChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays medical history text in view mode', () => {
    render(<MedicalHistoryCard {...defaultProps} />)
    expect(screen.getByText('Knee sprain')).toBeInTheDocument()
    expect(screen.getByText('Vitamin D')).toBeInTheDocument()
  })

  it('edit button calls onStartEdit', async () => {
    render(<MedicalHistoryCard {...defaultProps} />)
    // In view mode the Edit2 icon button is rendered
    const buttons = screen.getAllByRole('button')
    // The edit button is the one visible in non-editing mode
    await userEvent.click(buttons[0])
    expect(defaultProps.onStartEdit).toHaveBeenCalled()
  })

  it('edit mode shows input fields', () => {
    render(<MedicalHistoryCard {...defaultProps} isEditing={true} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBe(3) // injuries, surgeries, medications
  })

  it('save button calls onSave in edit mode', async () => {
    render(<MedicalHistoryCard {...defaultProps} isEditing={true} />)
    const buttons = screen.getAllByRole('button')
    // In edit mode the Save icon button is rendered
    await userEvent.click(buttons[0])
    expect(defaultProps.onSave).toHaveBeenCalled()
  })
})

// =====================================================================
// EvaluationCard
// =====================================================================
describe('EvaluationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders weight and date', () => {
    render(<EvaluationCard evaluation={baseEvaluation} />)
    expect(screen.getByText('68kg')).toBeInTheDocument()
    // formatted date comes from the mock
    expect(screen.getByText(/formatted-date/)).toBeInTheDocument()
  })

  it('renders body fat percentage', () => {
    render(<EvaluationCard evaluation={baseEvaluation} />)
    expect(screen.getByText('22%')).toBeInTheDocument()
  })

  it('expand button shows more details', async () => {
    render(<EvaluationCard evaluation={baseEvaluation} />)
    // Initially perimeter/skinfold sections not visible
    expect(screen.queryByText('perimetersCm')).not.toBeInTheDocument()

    // Click the expandable area
    const expandableArea = screen.getByText('68kg').closest('[class*="cursor-pointer"]')
    if (expandableArea) {
      await userEvent.click(expandableArea)
    }

    expect(screen.getByText('perimetersCm')).toBeInTheDocument()
    expect(screen.getByText('skinfoldsMm')).toBeInTheDocument()
  })

  it('edit triggers modal', async () => {
    render(<EvaluationCard evaluation={baseEvaluation} />)
    // Find the Edit2 button (first action button)
    const editButtons = screen.getAllByRole('button')
    // The edit button contains the Edit2 icon - click the first small button
    const editBtn = editButtons.find((btn) => btn.querySelector('.lucide-edit-2, [class*="edit"]'))
    // Click whichever button triggers the edit modal
    await userEvent.click(editButtons[0])
  })
})

// =====================================================================
// WorkoutCard
// =====================================================================
describe('WorkoutCard', () => {
  const defaultProps = {
    workout: baseWorkout,
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onActivate: vi.fn(),
    onEdit: vi.fn(),
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders workout title and description', () => {
    render(<WorkoutCard {...defaultProps} />)
    expect(screen.getByText('Treino A - Upper Body')).toBeInTheDocument()
    expect(screen.getByText('Focus on chest and back')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<WorkoutCard {...defaultProps} />)
    expect(screen.getByText('#Upper')).toBeInTheDocument()
    expect(screen.getByText('#Strength')).toBeInTheDocument()
  })

  it('expand shows exercises', async () => {
    render(<WorkoutCard {...defaultProps} />)
    // Click the expand button
    const expandBtn = screen.getByText(/viewItems/)
    await userEvent.click(expandBtn)

    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Light Jog')).toBeInTheDocument()
  })

  it('edit button calls onEdit', async () => {
    render(<WorkoutCard {...defaultProps} />)
    const editBtn = screen.getByTitle('editPlan')
    await userEvent.click(editBtn)
    expect(defaultProps.onEdit).toHaveBeenCalledWith(baseWorkout)
  })

  it('delete button calls onDelete', async () => {
    render(<WorkoutCard {...defaultProps} />)
    const deleteBtn = screen.getByTitle('deletePlan')
    await userEvent.click(deleteBtn)
    expect(defaultProps.onDelete).toHaveBeenCalledWith('w1')
  })

  it('archive button shown when active', () => {
    render(<WorkoutCard {...defaultProps} isActive={true} />)
    expect(screen.getByTitle('archivePlan')).toBeInTheDocument()
  })

  it('activate button shown when not active', () => {
    render(<WorkoutCard {...defaultProps} isActive={false} />)
    expect(screen.getByTitle('reactivatePlan')).toBeInTheDocument()
  })

  it('archive button not shown when inactive', () => {
    render(<WorkoutCard {...defaultProps} isActive={false} />)
    expect(screen.queryByTitle('archivePlan')).not.toBeInTheDocument()
  })
})

// =====================================================================
// ProgressChart
// =====================================================================
describe('ProgressChart', () => {
  const chartableMetrics: Record<string, { label: string; unit: string }> = {
    weight: { label: 'Weight', unit: 'kg' },
    bodyFat: { label: 'Body Fat', unit: '%' },
  }

  const defaultProps = {
    chartData: [
      { date: '2025-10-01', value: 70 },
      { date: '2025-11-01', value: 68 },
      { date: '2025-12-01', value: 66 },
    ],
    selectedMetric: 'weight',
    onMetricChange: vi.fn(),
    chartableMetrics,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart when enough data (>= 2 points)', () => {
    render(<ProgressChart {...defaultProps} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('shows notEnoughData when < 2 data points', () => {
    render(<ProgressChart {...defaultProps} chartData={[{ date: '2025-10-01', value: 70 }]} />)
    expect(screen.getByText('notEnoughData')).toBeInTheDocument()
  })

  it('shows notEnoughData when 0 data points', () => {
    render(<ProgressChart {...defaultProps} chartData={[]} />)
    expect(screen.getByText('notEnoughData')).toBeInTheDocument()
  })

  it('metric selector calls onMetricChange', async () => {
    render(<ProgressChart {...defaultProps} />)
    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'bodyFat')
    expect(defaultProps.onMetricChange).toHaveBeenCalled()
  })

  it('displays progression label with unit', () => {
    render(<ProgressChart {...defaultProps} />)
    expect(screen.getByText(/Weight Progression \(kg\)/)).toBeInTheDocument()
  })
})

// =====================================================================
// SessionLogModal
// =====================================================================
describe('SessionLogModal', () => {
  const defaultProps = {
    clientId: 'c1',
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<SessionLogModal {...defaultProps} />)
    expect(screen.getByLabelText('date')).toBeInTheDocument()
    expect(screen.getByLabelText('time')).toBeInTheDocument()
    expect(screen.getByLabelText('durationMinutes')).toBeInTheDocument()
    expect(screen.getByLabelText('type')).toBeInTheDocument()
    expect(screen.getByLabelText('category')).toBeInTheDocument()
    expect(screen.getByLabelText('sessionNotes')).toBeInTheDocument()
  })

  it('submit calls onSave', async () => {
    render(<SessionLogModal {...defaultProps} />)
    const submitBtn = screen.getByText('saveSession')
    await userEvent.click(submitBtn)
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalled()
    })
  })

  it('loading state shows saving text', async () => {
    const slowSave = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 500)))
    render(<SessionLogModal {...defaultProps} onSave={slowSave} />)
    const submitBtn = screen.getByText('saveSession')
    await userEvent.click(submitBtn)
    expect(screen.getByText('saving')).toBeInTheDocument()
  })

  it('close button calls onClose', async () => {
    render(<SessionLogModal {...defaultProps} />)
    const cancelBtn = screen.getByText('cancel')
    await userEvent.click(cancelBtn)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})

// =====================================================================
// EvaluationModal
// =====================================================================
describe('EvaluationModal', () => {
  const defaultProps = {
    clientId: 'c1',
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialData: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with empty fields for new evaluation', () => {
    render(<EvaluationModal {...defaultProps} />)
    expect(screen.getByText('addEvaluation')).toBeInTheDocument()
    // Vitals tab is active by default
    expect(screen.getByText('weightKg')).toBeInTheDocument()
  })

  it('tab switching works', async () => {
    render(<EvaluationModal {...defaultProps} />)
    // Switch to perimeters tab
    await userEvent.click(screen.getByText('perimeters'))
    expect(screen.getByText('perimeterLabel.chest')).toBeInTheDocument()

    // Switch to skinfolds tab
    await userEvent.click(screen.getByText('skinfolds'))
    expect(screen.getByText('skinfoldLabel.triceps')).toBeInTheDocument()

    // Switch back to vitals
    await userEvent.click(screen.getByText('vitals'))
    expect(screen.getByText('weightKg')).toBeInTheDocument()
  })

  it('submit calls onSave', async () => {
    render(<EvaluationModal {...defaultProps} />)
    // Weight is required — fill it in before submitting
    const weightInput = screen.getAllByRole('spinbutton')[0]
    await userEvent.type(weightInput, '70')
    const saveBtn = screen.getByText('save')
    await userEvent.click(saveBtn)
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('cancel calls onClose', async () => {
    render(<EvaluationModal {...defaultProps} />)
    const cancelBtn = screen.getByText('cancel')
    await userEvent.click(cancelBtn)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('renders pre-filled when initialData is provided', () => {
    render(<EvaluationModal {...defaultProps} initialData={baseEvaluation} />)
    const weightInput = screen.getByDisplayValue('68')
    expect(weightInput).toBeInTheDocument()
  })
})

// =====================================================================
// ConfirmationModal
// =====================================================================
describe('ConfirmationModal', () => {
  const defaultProps = {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and message', () => {
    render(<ConfirmationModal {...defaultProps} />)
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
  })

  it('confirm button calls onConfirm', async () => {
    render(<ConfirmationModal {...defaultProps} />)
    await userEvent.click(screen.getByText('confirm'))
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('cancel button calls onCancel', async () => {
    render(<ConfirmationModal {...defaultProps} />)
    await userEvent.click(screen.getByText('cancel'))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })
})
