/**
 * Tests for FormSuccessOverlay component
 *
 * Tests cover:
 * - Renders when show=true
 * - Hidden when show=false
 * - onComplete fires after duration
 * - ARIA attributes are present for accessibility
 * - Dismiss button appears after navigation failure
 * - onDismiss callback is called when dismiss button clicked
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { FormSuccessOverlay } from '../form-success-overlay'

describe('FormSuccessOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders when show is true', () => {
      render(<FormSuccessOverlay show={true} message="Activity Added!" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Activity Added!')).toBeInTheDocument()
    })

    it('does not render when show is false', () => {
      render(<FormSuccessOverlay show={false} message="Activity Added!" />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByText('Activity Added!')).not.toBeInTheDocument()
    })

    it('uses default message when not provided', () => {
      render(<FormSuccessOverlay show={true} />)

      expect(screen.getByText('Activity Added!')).toBeInTheDocument()
    })

    it('displays custom message', () => {
      render(<FormSuccessOverlay show={true} message="Custom Success!" />)

      expect(screen.getByText('Custom Success!')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<FormSuccessOverlay show={true} message="Activity Added!" />)

      const overlay = screen.getByRole('status')
      expect(overlay).toBeInTheDocument()
    })

    it('has aria-live="polite" for screen reader announcements', () => {
      render(<FormSuccessOverlay show={true} message="Activity Added!" />)

      const overlay = screen.getByRole('status')
      expect(overlay).toHaveAttribute('aria-live', 'polite')
    })

    it('has aria-label with the message', () => {
      render(<FormSuccessOverlay show={true} message="Lodging Updated!" />)

      const overlay = screen.getByRole('status')
      expect(overlay).toHaveAttribute('aria-label', 'Lodging Updated!')
    })

    it('has aria-hidden on decorative icon', () => {
      render(<FormSuccessOverlay show={true} message="Activity Added!" />)

      // The CheckCircle2 icon should have aria-hidden
      const overlay = screen.getByRole('status')
      const icon = overlay.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('onComplete callback', () => {
    it('fires onComplete after default duration (1000ms)', async () => {
      const onComplete = vi.fn()
      render(<FormSuccessOverlay show={true} onComplete={onComplete} />)

      expect(onComplete).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('fires onComplete after custom duration', async () => {
      const onComplete = vi.fn()
      render(<FormSuccessOverlay show={true} onComplete={onComplete} duration={500} />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(499)
      })
      expect(onComplete).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('does not fire onComplete when not provided', () => {
      render(<FormSuccessOverlay show={true} />)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // No error should occur
    })

    it('cleans up timer on unmount', () => {
      const onComplete = vi.fn()
      const { unmount } = render(<FormSuccessOverlay show={true} onComplete={onComplete} duration={1000} />)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('navigation failure handling', () => {
    // These tests use real timers with short durations since async mocks
    // don't play well with fake timers
    it('shows dismiss button when onComplete returns failure result', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: false, error: 'Navigation failed' })
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      // Initially no dismiss button
      expect(screen.queryByText('Continue editing')).not.toBeInTheDocument()

      // Wait for async onComplete to resolve and show dismiss button
      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('shows dismiss button when onComplete throws an error', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockRejectedValue(new Error('Navigation error'))
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('calls onDismiss when dismiss button is clicked', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: false })
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })

      fireEvent.click(screen.getByText('Continue editing'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not show dismiss button on successful navigation', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: true })
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      // Wait for onComplete to be called
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 500 })

      // Give a bit more time for state to settle
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(screen.queryByText('Continue editing')).not.toBeInTheDocument()
    })

    it('resets dismiss state when show becomes false', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: false })
      const onDismiss = vi.fn()

      const { rerender } = render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })

      // Hide overlay
      rerender(
        <FormSuccessOverlay
          show={false}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      // Show again
      rerender(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      // Dismiss button should be reset
      expect(screen.queryByText('Continue editing')).not.toBeInTheDocument()
    })

    it('focuses dismiss button when it appears for keyboard accessibility', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: false })
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })

      // Verify dismiss button has focus
      const dismissButton = screen.getByText('Continue editing')
      expect(document.activeElement).toBe(dismissButton)
    })

    it('dismiss button has visible focus ring styling', async () => {
      vi.useRealTimers()
      const onComplete = vi.fn().mockResolvedValue({ success: false })
      const onDismiss = vi.fn()

      render(
        <FormSuccessOverlay
          show={true}
          onComplete={onComplete}
          onDismiss={onDismiss}
          duration={50}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Continue editing')).toBeInTheDocument()
      }, { timeout: 500 })

      // Verify dismiss button has focus ring classes
      const dismissButton = screen.getByText('Continue editing')
      expect(dismissButton).toHaveClass('focus:ring-2')
    })
  })
})
