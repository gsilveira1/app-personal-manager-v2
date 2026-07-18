import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatCard } from './StatCard'
import { ModalShell } from './ModalShell'
import { EmptyState } from './EmptyState'
import { FormField } from './FormField'
import { SearchBar } from './SearchBar'
import { TabBar } from './TabBar'
import { ClientAvatar } from './ClientAvatar'
import { ConfirmationDialog } from './ConfirmationDialog'

const MockIcon = (props: any) => <svg data-testid="mock-icon" {...props} />

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
describe('StatCard', () => {
  const defaultProps = {
    title: 'Total Clients',
    value: '42',
    icon: MockIcon,
    description: 'Active this month',
  }

  it('renders title, value, and description', () => {
    render(<StatCard {...defaultProps} />)
    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Active this month')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<StatCard {...defaultProps} />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('applies alert styling when isAlert is true', () => {
    render(<StatCard {...defaultProps} isAlert />)
    const icon = screen.getByTestId('mock-icon')
    expect(icon).toHaveClass('text-red-600')
  })

  it('applies default (non-alert) styling when isAlert is false', () => {
    render(<StatCard {...defaultProps} />)
    const icon = screen.getByTestId('mock-icon')
    expect(icon).toHaveClass('text-slate-600')
  })
})

// ---------------------------------------------------------------------------
// ModalShell
// ---------------------------------------------------------------------------
describe('ModalShell', () => {
  const defaultProps = {
    title: 'Modal Title',
    onClose: vi.fn(),
  }

  it('renders title', () => {
    render(<ModalShell {...defaultProps}>Content</ModalShell>)
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<ModalShell {...defaultProps}><p>Body content</p></ModalShell>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ModalShell title="Test" onClose={onClose}>Content</ModalShell>)
    // The close button is a ghost Button containing the X icon
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the backdrop overlay', () => {
    const { container } = render(<ModalShell {...defaultProps}>Content</ModalShell>)
    const backdrop = container.firstElementChild as HTMLElement
    expect(backdrop).toHaveClass('fixed', 'inset-0')
  })
})

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
describe('EmptyState', () => {
  it('renders icon and title', () => {
    render(<EmptyState icon={MockIcon} title="No data found" />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders optional description', () => {
    render(<EmptyState icon={MockIcon} title="Empty" description="Try adding something" />)
    expect(screen.getByText('Try adding something')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState icon={MockIcon} title="Empty" />)
    const paragraphs = container.querySelectorAll('p')
    // Only the title paragraph should exist
    expect(paragraphs).toHaveLength(1)
  })

  it('renders optional action', () => {
    render(<EmptyState icon={MockIcon} title="Empty" action={<button>Add item</button>} />)
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument()
  })

  it('does not render action wrapper when not provided', () => {
    const { container } = render(<EmptyState icon={MockIcon} title="Empty" />)
    // No mt-4 action div should exist
    expect(container.querySelector('.mt-4')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------
describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email">
        <input data-testid="email-input" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <FormField label="Email" error="Required field">
        <input />
      </FormField>
    )
    expect(screen.getByText('Required field')).toBeInTheDocument()
    expect(screen.getByText('Required field')).toHaveClass('text-red-500')
  })

  it('renders hint when no error', () => {
    render(
      <FormField label="Email" hint="We will never share your email">
        <input />
      </FormField>
    )
    expect(screen.getByText('We will never share your email')).toBeInTheDocument()
    expect(screen.getByText('We will never share your email')).toHaveClass('text-slate-400')
  })

  it('hides hint when error is shown', () => {
    render(
      <FormField label="Email" error="Invalid" hint="Enter a valid email">
        <input />
      </FormField>
    )
    expect(screen.getByText('Invalid')).toBeInTheDocument()
    expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument()
  })

  it('passes htmlFor to label', () => {
    render(
      <FormField label="Name" htmlFor="name-field">
        <input id="name-field" />
      </FormField>
    )
    expect(screen.getByText('Name')).toHaveAttribute('for', 'name-field')
  })
})

// ---------------------------------------------------------------------------
// SearchBar
// ---------------------------------------------------------------------------
describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search clients..." />)
    expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument()
  })

  it('calls onChange with the input value', () => {
    const handleChange = vi.fn()
    render(<SearchBar value="" onChange={handleChange} placeholder="Search" />)
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'John' } })
    expect(handleChange).toHaveBeenCalledWith('John')
  })

  it('displays the current value', () => {
    render(<SearchBar value="test query" onChange={vi.fn()} placeholder="Search" />)
    expect(screen.getByPlaceholderText('Search')).toHaveValue('test query')
  })

  it('renders the search icon', () => {
    const { container } = render(<SearchBar value="" onChange={vi.fn()} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------
describe('TabBar', () => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'history', label: 'History' },
  ]

  it('renders all tabs', () => {
    render(<TabBar tabs={tabs} activeTab="overview" onChange={vi.fn()} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    render(<TabBar tabs={tabs} activeTab="details" onChange={vi.fn()} />)
    expect(screen.getByText('Details')).toHaveClass('bg-white', 'text-slate-900')
    expect(screen.getByText('Overview')).toHaveClass('text-slate-500')
  })

  it('calls onChange with tab id when clicked', () => {
    const handleChange = vi.fn()
    render(<TabBar tabs={tabs} activeTab="overview" onChange={handleChange} />)
    fireEvent.click(screen.getByText('History'))
    expect(handleChange).toHaveBeenCalledWith('history')
  })

  it('renders tab icons when provided', () => {
    const tabsWithIcons = [
      { id: 'tab1', label: 'Tab 1', icon: MockIcon },
    ]
    render(<TabBar tabs={tabsWithIcons} activeTab="tab1" onChange={vi.fn()} />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// ClientAvatar
// ---------------------------------------------------------------------------
describe('ClientAvatar', () => {
  it('renders initials when no avatar is provided', () => {
    render(<ClientAvatar name="Maria Silva" />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renders uppercase initial', () => {
    render(<ClientAvatar name="joao" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders img when avatar is provided', () => {
    render(<ClientAvatar name="Maria" avatar="https://example.com/avatar.jpg" />)
    const img = screen.getByRole('img', { name: 'Maria' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders initials when avatar is null', () => {
    render(<ClientAvatar name="Carlos" avatar={null} />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('renders sm size', () => {
    const { container } = render(<ClientAvatar name="Ana" size="sm" />)
    const avatar = container.firstElementChild as HTMLElement
    expect(avatar).toHaveClass('h-9', 'w-9')
  })

  it('renders md size (default)', () => {
    const { container } = render(<ClientAvatar name="Ana" />)
    const avatar = container.firstElementChild as HTMLElement
    expect(avatar).toHaveClass('h-10', 'w-10')
  })

  it('renders lg size', () => {
    const { container } = render(<ClientAvatar name="Ana" size="lg" />)
    const avatar = container.firstElementChild as HTMLElement
    expect(avatar).toHaveClass('h-12', 'w-12')
  })
})

// ---------------------------------------------------------------------------
// ConfirmationDialog
// ---------------------------------------------------------------------------
describe('ConfirmationDialog', () => {
  const defaultProps = {
    title: 'Delete Client',
    message: 'Are you sure you want to delete this client?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders title and message', () => {
    render(<ConfirmationDialog {...defaultProps} />)
    expect(screen.getByText('Delete Client')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this client?')).toBeInTheDocument()
  })

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmationDialog {...defaultProps} />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows loading state with ellipsis', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading />)
    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('disables confirm button when loading', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading />)
    const confirmBtn = screen.getByText('...')
    expect(confirmBtn.closest('button')).toBeDisabled()
  })

  it('applies danger variant to confirm button', () => {
    render(<ConfirmationDialog {...defaultProps} variant="danger" />)
    const confirmBtn = screen.getByText('Delete').closest('button') as HTMLElement
    expect(confirmBtn).toHaveClass('bg-red-500')
  })
})
