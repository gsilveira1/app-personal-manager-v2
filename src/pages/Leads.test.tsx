import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Leads } from './Leads'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const mockUpdateClient = vi.fn().mockResolvedValue(undefined)
const mockConvertLead = vi.fn().mockResolvedValue(undefined)

let mockClients = [
  { id: 'l1', name: 'Lead A', email: 'a@test.com', phone: '123', status: 'Lead', type: 'In-Person' as const, notes: null },
  { id: 'l2', name: 'Lead B', email: 'b@test.com', phone: '456', status: 'Lead', type: 'Online' as const, notes: JSON.stringify({ __stage: 'Contacted', __userNotes: '' }) },
  { id: 'c1', name: 'Active Client', email: 'c@test.com', phone: '789', status: 'Active', type: 'In-Person' as const },
]

vi.mock('../store/store', () => ({
  useStore: () => ({
    clients: mockClients,
    plans: [{ id: 'p1', name: 'Plan A', type: 'PRESENCIAL', sessionsPerWeek: 3, durationMinutes: 60, price: 400 }],
    updateClient: mockUpdateClient,
    convertLead: mockConvertLead,
  }),
}))

let capturedOnStageChange: any
let capturedOnConvert: any
let capturedOnMarkLost: any

vi.mock('../components/organisms/leads/LeadKanban', () => ({
  LeadKanban: ({ stages, byStage, onLeadClick }: any) => (
    <div data-testid="lead-kanban">
      {Object.entries(byStage).map(([stage, leads]: [string, any]) =>
        leads.map((l: any) => <button key={l.id} onClick={() => onLeadClick(l)}>{l.name}</button>)
      )}
    </div>
  ),
}))

vi.mock('../components/organisms/leads/LeadDrawer', () => ({
  LeadDrawer: ({ lead, onClose, onStageChange, onConvert, onMarkLost }: any) => {
    capturedOnStageChange = onStageChange
    capturedOnConvert = onConvert
    capturedOnMarkLost = onMarkLost
    return (
      <div data-testid="lead-drawer">
        {lead.name}
        <button onClick={onClose}>close</button>
        <button onClick={() => onStageChange(lead.id, 'Interested', 'notes')}>changeStage</button>
        <button onClick={() => onConvert(lead.id, 'p1')}>convert</button>
        <button onClick={() => onMarkLost(lead.id)}>markLost</button>
      </div>
    )
  },
}))

describe('Leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClients = [
      { id: 'l1', name: 'Lead A', email: 'a@test.com', phone: '123', status: 'Lead', type: 'In-Person' as const, notes: null },
      { id: 'l2', name: 'Lead B', email: 'b@test.com', phone: '456', status: 'Lead', type: 'Online' as const, notes: JSON.stringify({ __stage: 'Contacted', __userNotes: '' }) },
      { id: 'c1', name: 'Active Client', email: 'c@test.com', phone: '789', status: 'Active', type: 'In-Person' as const },
    ]
  })

  const renderPage = () => render(<MemoryRouter><Leads /></MemoryRouter>)

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders stat cards', () => {
    renderPage()
    expect(screen.getAllByText('newThisWeek').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('conversionRate').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('avgLeadAge').length).toBeGreaterThanOrEqual(1)
  })

  it('renders lead kanban when leads exist', () => {
    renderPage()
    expect(screen.getByTestId('lead-kanban')).toBeInTheDocument()
  })

  it('renders lead names in kanban', () => {
    renderPage()
    expect(screen.getByText('Lead A')).toBeInTheDocument()
    expect(screen.getByText('Lead B')).toBeInTheDocument()
  })

  it('opens drawer when lead is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    expect(screen.getByTestId('lead-drawer')).toBeInTheDocument()
  })

  it('closes drawer when close button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    expect(screen.getByTestId('lead-drawer')).toBeInTheDocument()
    fireEvent.click(screen.getByText('close'))
    expect(screen.queryByTestId('lead-drawer')).not.toBeInTheDocument()
  })

  it('calls updateClient with encoded notes on stage change', async () => {
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    fireEvent.click(screen.getByText('changeStage'))
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith('l1', { notes: expect.any(String) })
    })
  })

  it('calls convertLead, clears selection, and navigates on convert', async () => {
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    fireEvent.click(screen.getByText('convert'))
    await waitFor(() => {
      expect(mockConvertLead).toHaveBeenCalledWith('l1', 'p1')
      expect(mockNavigate).toHaveBeenCalledWith('/clients/l1')
    })
  })

  it('calls updateClient with Inactive status on mark lost (confirmed)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    fireEvent.click(screen.getByText('markLost'))
    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith('l1', { status: 'Inactive' })
    })
  })

  it('does not update when mark lost is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByText('Lead A'))
    fireEvent.click(screen.getByText('markLost'))
    expect(mockUpdateClient).not.toHaveBeenCalled()
  })

  it('shows empty state when no leads exist', () => {
    mockClients = [{ id: 'c1', name: 'Active Client', email: 'c@test.com', phone: '789', status: 'Active', type: 'In-Person' as const }]
    renderPage()
    expect(screen.getByText('noLeads')).toBeInTheDocument()
  })
})
