import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../utils/leadHelpers', () => ({
  STAGES: [
    { id: 'New', labelKey: 'newLead', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    { id: 'Contacted', labelKey: 'contacted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { id: 'Interested', labelKey: 'interested', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  ],
  parseStage: () => 'New' as const,
  parseUserNotes: () => '',
  daysAgo: () => '2d',
  interestLabel: () => 'presencial',
  whatsappUrl: (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`,
}))

import { LeadCard } from './LeadCard'
import { LeadKanban } from './LeadKanban'
import { LeadDrawer } from './LeadDrawer'
import type { Client, Plan } from '../../../types'
import type { LeadStage } from '../../../utils/leadHelpers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLead = (overrides: Partial<Client> = {}): Client => ({
  id: 'lead-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '5553999887766',
  status: 'Lead',
  type: 'In-Person',
  goal: 'Emagrecimento',
  notes: JSON.stringify({ __stage: 'New', __userNotes: '' }),
  ...overrides,
})

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  type: 'PRESENCIAL',
  name: 'Plano Básico',
  sessionsPerWeek: 3,
  durationMinutes: 60,
  price: 350,
  features: [],
  ...overrides,
})

// ===========================================================================
// LeadCard
// ===========================================================================
describe('LeadCard', () => {
  const defaultProps = {
    client: makeLead(),
    stage: 'New' as LeadStage,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders client name and avatar initial', () => {
    render(<LeadCard {...defaultProps} />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('displays the stage badge', () => {
    render(<LeadCard {...defaultProps} />)
    expect(screen.getByText('newLead')).toBeInTheDocument()
  })

  it('renders WhatsApp link with correct href', () => {
    render(<LeadCard {...defaultProps} />)
    const waLink = screen.getByRole('link', { name: /whatsapp/i })
    expect(waLink).toHaveAttribute('href', 'https://wa.me/5553999887766')
    expect(waLink).toHaveAttribute('target', '_blank')
  })

  it('renders email link with correct href', () => {
    render(<LeadCard {...defaultProps} />)
    const emailLink = screen.getByRole('link', { name: /email/i })
    expect(emailLink).toHaveAttribute('href', 'mailto:maria@example.com')
  })

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadCard {...defaultProps} />)
    // The card is the outer button wrapping everything
    const card = screen.getByRole('button', { name: /maria silva/i })
    await user.click(card)
    expect(defaultProps.onClick).toHaveBeenCalledOnce()
  })

  it('displays the interest badge', () => {
    render(<LeadCard {...defaultProps} />)
    // interestLabel mock returns 'presencial'
    expect(screen.getByText('presencial')).toBeInTheDocument()
  })
})

// ===========================================================================
// LeadKanban
// ===========================================================================
describe('LeadKanban', () => {
  const stages = [
    { id: 'New' as LeadStage, labelKey: 'newLead', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    { id: 'Contacted' as LeadStage, labelKey: 'contacted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { id: 'Interested' as LeadStage, labelKey: 'interested', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  ]

  const byStage: Record<LeadStage, Client[]> = {
    New: [makeLead(), makeLead({ id: 'lead-2', name: 'João Santos' })],
    Contacted: [makeLead({ id: 'lead-3', name: 'Ana Costa' })],
    Interested: [],
    Won: [],
    Lost: [],
  }

  const onLeadClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all stage columns', () => {
    render(<LeadKanban stages={stages} byStage={byStage} onLeadClick={onLeadClick} />)
    // Column headers use <h3> elements
    const headers = screen.getAllByRole('heading', { level: 3 })
    const headerTexts = headers.map((h) => h.textContent)
    expect(headerTexts).toContain('newLead')
    expect(headerTexts).toContain('contacted')
    expect(headerTexts).toContain('interested')
  })

  it('shows lead count per stage', () => {
    render(<LeadKanban stages={stages} byStage={byStage} onLeadClick={onLeadClick} />)
    expect(screen.getByText('2')).toBeInTheDocument() // New column
    expect(screen.getByText('1')).toBeInTheDocument() // Contacted column
    expect(screen.getByText('0')).toBeInTheDocument() // Interested column
  })

  it('shows placeholder text for empty columns', () => {
    render(<LeadKanban stages={stages} byStage={byStage} onLeadClick={onLeadClick} />)
    expect(screen.getByText('noLeadsInColumn')).toBeInTheDocument()
  })

  it('renders a LeadCard for each lead in the stage', () => {
    render(<LeadKanban stages={stages} byStage={byStage} onLeadClick={onLeadClick} />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('João Santos')).toBeInTheDocument()
    expect(screen.getByText('Ana Costa')).toBeInTheDocument()
  })
})

// ===========================================================================
// LeadDrawer
// ===========================================================================
describe('LeadDrawer', () => {
  const defaultProps = {
    lead: makeLead(),
    plans: [makePlan()],
    onClose: vi.fn(),
    onStageChange: vi.fn(),
    onConvert: vi.fn().mockResolvedValue(undefined),
    onMarkLost: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders lead name and avatar initial', () => {
    render(<LeadDrawer {...defaultProps} />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renders stage buttons for all stages', () => {
    render(<LeadDrawer {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'newLead' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'contacted' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'interested' })).toBeInTheDocument()
  })

  it('renders contact links', () => {
    render(<LeadDrawer {...defaultProps} />)
    const links = screen.getAllByRole('link')
    const waLink = links.find((l) => l.getAttribute('href')?.includes('wa.me'))
    const emailLink = links.find((l) => l.getAttribute('href')?.includes('mailto:'))
    expect(waLink).toBeDefined()
    expect(emailLink).toHaveAttribute('href', 'mailto:maria@example.com')
  })

  it('close button calls onClose', async () => {
    const user = userEvent.setup()
    render(<LeadDrawer {...defaultProps} />)
    // The X button in the header
    const closeButtons = screen.getAllByRole('button')
    const closeBtn = closeButtons.find((b) => b.querySelector('.lucide-x'))
    expect(closeBtn).toBeDefined()
    await user.click(closeBtn!)
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('convert button opens nested modal', async () => {
    const user = userEvent.setup()
    render(<LeadDrawer {...defaultProps} />)
    const convertBtn = screen.getByRole('button', { name: /convertToClient/i })
    await user.click(convertBtn)
    // Nested modal should now display plan selector and confirm button
    expect(screen.getByText('convertLeadTitle')).toBeInTheDocument()
    expect(screen.getByText('Plano Básico')).toBeInTheDocument()
  })

  it('mark lost button calls onMarkLost with lead id', async () => {
    const user = userEvent.setup()
    render(<LeadDrawer {...defaultProps} />)
    const lostBtn = screen.getByRole('button', { name: /markAsLost/i })
    await user.click(lostBtn)
    expect(defaultProps.onMarkLost).toHaveBeenCalledWith('lead-1')
  })

  it('clicking a stage button calls onStageChange', async () => {
    const user = userEvent.setup()
    render(<LeadDrawer {...defaultProps} />)
    const contactedBtn = screen.getByRole('button', { name: 'contacted' })
    await user.click(contactedBtn)
    expect(defaultProps.onStageChange).toHaveBeenCalledWith('lead-1', 'Contacted', '')
  })

  it('convert modal confirm calls onConvert', async () => {
    const user = userEvent.setup()
    render(<LeadDrawer {...defaultProps} />)
    // Open convert modal
    await user.click(screen.getByRole('button', { name: /convertToClient/i }))
    // Confirm conversion
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmBtn)
    await waitFor(() => {
      expect(defaultProps.onConvert).toHaveBeenCalledWith('lead-1', undefined)
    })
  })
})
