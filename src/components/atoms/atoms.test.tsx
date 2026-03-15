import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'
import { Badge } from './Badge'
import { Label } from './Label'
import { Select } from './Select'
import { Spinner } from './Spinner'
import { Textarea } from './Textarea'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('defaults to primary variant', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600')
  })

  it.each([
    ['primary', 'bg-indigo-600'],
    ['secondary', 'bg-slate-100'],
    ['outline', 'border-slate-200'],
    ['ghost', 'hover:bg-slate-100'],
    ['danger', 'bg-red-500'],
  ] as const)('renders %s variant with class %s', (variant, expectedClass) => {
    render(<Button variant={variant}>{variant}</Button>)
    expect(screen.getByRole('button')).toHaveClass(expectedClass)
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Button className="my-custom">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('my-custom')
  })

  it('supports disabled state', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveClass('disabled:opacity-50')
  })
})

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="extra-class">Content</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div).toHaveClass('extra-class')
  })

  it('renders as a div with base styles', () => {
    const { container } = render(<Card>Content</Card>)
    const div = container.firstElementChild as HTMLElement
    expect(div.tagName).toBe('DIV')
    expect(div).toHaveClass('rounded-lg', 'border', 'shadow-sm')
  })
})

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('handles change events', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('applies placeholder text', () => {
    render(<Input placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-800')
  })

  it.each([
    ['success', 'bg-green-100', 'text-green-800'],
    ['warning', 'bg-yellow-100', 'text-yellow-800'],
    ['error', 'bg-red-100', 'text-red-800'],
  ] as const)('renders %s variant', (variant, bgClass, textClass) => {
    render(<Badge variant={variant}>{variant}</Badge>)
    const badge = screen.getByText(variant)
    expect(badge).toHaveClass(bgClass, textClass)
  })

  it('applies custom className', () => {
    render(<Badge className="extra">Styled</Badge>)
    expect(screen.getByText('Styled')).toHaveClass('extra')
  })
})

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------
describe('Label', () => {
  it('renders with text content', () => {
    render(<Label>Email</Label>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email</Label>)
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-input')
  })

  it('renders as a label element', () => {
    render(<Label>Name</Label>)
    expect(screen.getByText('Name').tagName).toBe('LABEL')
  })
})

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------
describe('Select', () => {
  it('renders with options', () => {
    render(
      <Select defaultValue="b">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    )
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('b')
  })

  it('handles change events', () => {
    const handleChange = vi.fn()
    render(
      <Select onChange={handleChange}>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('renders the chevron icon', () => {
    const { container } = render(
      <Select>
        <option value="x">X</option>
      </Select>
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(
      <Select disabled>
        <option value="a">A</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('accepts a ref', () => {
    const ref = { current: null as HTMLSelectElement | null }
    render(
      <Select ref={ref}>
        <option value="a">A</option>
      </Select>
    )
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })
})

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
describe('Spinner', () => {
  it('renders with default size', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('animate-spin')
  })

  it('renders with custom size', () => {
    const { container } = render(<Spinner size={48} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-indigo-600" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-indigo-600')
  })
})

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Write here" />)
    expect(screen.getByPlaceholderText('Write here')).toBeInTheDocument()
  })

  it('handles change events', () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'text' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('supports disabled state', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" placeholder="test" />)
    expect(screen.getByPlaceholderText('test')).toHaveClass('custom-class')
  })
})
