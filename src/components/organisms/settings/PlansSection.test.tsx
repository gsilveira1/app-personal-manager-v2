import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlansSection } from './PlansSection'
import type { Plan } from '../../../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockPresencialPlan: Plan = {
  id: 'plan-1',
  type: 'PRESENCIAL',
  name: 'Plano Presencial 3x',
  sessionsPerWeek: 3,
  durationMinutes: 60,
  price: 450,
}

const mockConsultoriaPlan: Plan = {
  id: 'plan-2',
  type: 'CONSULTORIA',
  name: 'Consultoria Online Mensal',
  sessionsPerWeek: 5,
  price: 250,
}

describe('PlansSection', () => {
  const handleCreate = vi.fn()
  const handleEdit = vi.fn()
  const handleDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders presencial and consultoria plans under their respective section headings', () => {
    render(<PlansSection plans={[mockPresencialPlan, mockConsultoriaPlan]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    expect(screen.getByText('servicePlans')).toBeInTheDocument()
    expect(screen.getByText('servicePlansSubtitle')).toBeInTheDocument()
    expect(screen.getByText('inPersonSection')).toBeInTheDocument()
    expect(screen.getByText('onlineConsultingSection')).toBeInTheDocument()

    expect(screen.getByText('Plano Presencial 3x')).toBeInTheDocument()
    expect(screen.getByText('Consultoria Online Mensal')).toBeInTheDocument()
  })

  it('renders only presencial section when only presencial plans exist', () => {
    render(<PlansSection plans={[mockPresencialPlan]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    expect(screen.getByText('inPersonSection')).toBeInTheDocument()
    expect(screen.queryByText('onlineConsultingSection')).not.toBeInTheDocument()
    expect(screen.getByText('Plano Presencial 3x')).toBeInTheDocument()
  })

  it('renders only consultoria section when only consultoria plans exist', () => {
    render(<PlansSection plans={[mockConsultoriaPlan]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    expect(screen.queryByText('inPersonSection')).not.toBeInTheDocument()
    expect(screen.getByText('onlineConsultingSection')).toBeInTheDocument()
    expect(screen.getByText('Consultoria Online Mensal')).toBeInTheDocument()
  })

  it('renders empty state when no plans exist', () => {
    render(<PlansSection plans={[]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    expect(screen.getByText('noPlansCreated')).toBeInTheDocument()
    expect(screen.queryByText('inPersonSection')).not.toBeInTheDocument()
    expect(screen.queryByText('onlineConsultingSection')).not.toBeInTheDocument()
  })

  it('calls onCreate when the New Plan button is clicked', async () => {
    const user = userEvent.setup()
    render(<PlansSection plans={[mockPresencialPlan]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    const createBtn = screen.getByRole('button', { name: /newPlan/i })
    await user.click(createBtn)

    expect(handleCreate).toHaveBeenCalledOnce()
  })

  it('calls onEdit and onDelete on plan cards', async () => {
    const user = userEvent.setup()
    render(<PlansSection plans={[mockPresencialPlan, mockConsultoriaPlan]} onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} />)

    // Plan cards have edit and delete buttons
    // We can find all buttons in the document (the first is "newPlan", then edit/delete for plan 1, edit/delete for plan 2)
    const buttons = screen.getAllByRole('button')
    // buttons[0] = newPlan button
    // buttons[1] = edit plan 1
    // buttons[2] = delete plan 1
    // buttons[3] = edit plan 2
    // buttons[4] = delete plan 2

    await user.click(buttons[1])
    expect(handleEdit).toHaveBeenCalledWith(mockPresencialPlan)

    await user.click(buttons[2])
    expect(handleDelete).toHaveBeenCalledWith('plan-1')

    await user.click(buttons[3])
    expect(handleEdit).toHaveBeenCalledWith(mockConsultoriaPlan)

    await user.click(buttons[4])
    expect(handleDelete).toHaveBeenCalledWith('plan-2')
  })
})
