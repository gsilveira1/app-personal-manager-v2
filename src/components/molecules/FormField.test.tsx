import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(
      <FormField label="Name" error="Required">
        <input />
      </FormField>
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('shows hint when no error', () => {
    render(
      <FormField label="Bio" hint="Optional field">
        <textarea />
      </FormField>
    )
    expect(screen.getByText('Optional field')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(
      <FormField label="Bio" hint="Optional" error="Too long">
        <textarea />
      </FormField>
    )
    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
    expect(screen.getByText('Too long')).toBeInTheDocument()
  })
})
