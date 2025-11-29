import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge, {
  SuccessBadge,
  WarningBadge,
  ErrorBadge,
  InfoBadge,
  PendingBadge
} from '../../src/components/StatusBadge.jsx'

describe('StatusBadge', () => {
  it('renders with default info status', () => {
    render(<StatusBadge />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('renders custom children', () => {
    render(<StatusBadge status="success">Custom Text</StatusBadge>)
    expect(screen.getByText('Custom Text')).toBeInTheDocument()
  })

  it('applies correct classes for success status', () => {
    render(<StatusBadge status="success" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveClass('bg-emerald-500/20')
    expect(badge).toHaveClass('text-emerald-400')
  })

  it('applies correct classes for warning status', () => {
    render(<StatusBadge status="warning" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveClass('bg-amber-500/20')
    expect(badge).toHaveClass('text-amber-400')
  })

  it('applies correct classes for error status', () => {
    render(<StatusBadge status="error" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveClass('bg-rose-500/20')
    expect(badge).toHaveClass('text-rose-400')
  })

  it('hides icon when showIcon is false', () => {
    const { container } = render(<StatusBadge status="success" showIcon={false} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeInTheDocument()
  })

  it('applies different size classes', () => {
    const { rerender } = render(<StatusBadge size="xs" />)
    expect(screen.getByRole('status')).toHaveClass('text-xs')

    rerender(<StatusBadge size="md" />)
    expect(screen.getByRole('status')).toHaveClass('text-sm')

    rerender(<StatusBadge size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('text-base')
  })

  it('applies custom className', () => {
    render(<StatusBadge className="custom-class" />)
    expect(screen.getByRole('status')).toHaveClass('custom-class')
  })
})

describe('Named Badge Exports', () => {
  it('SuccessBadge renders with success status', () => {
    render(<SuccessBadge />)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('WarningBadge renders with warning status', () => {
    render(<WarningBadge />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('ErrorBadge renders with error status', () => {
    render(<ErrorBadge />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('InfoBadge renders with info status', () => {
    render(<InfoBadge />)
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('PendingBadge renders with pending status', () => {
    render(<PendingBadge />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})
