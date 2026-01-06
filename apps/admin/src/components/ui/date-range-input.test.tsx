/**
 * DateRangeInput Component Tests
 *
 * Tests the synchronization behavior between external props and internal state:
 * 1. Initial props populate the inputs correctly
 * 2. Changing props after mount re-syncs once (no loops)
 * 3. User input calls onChange without causing re-sync loops
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateRangeInput } from './date-range-input'

// Mock the DatePickerEnhanced component to simplify testing
// Store onChange handlers so tests can call them directly
const onChangeHandlers: Map<string, (date: string | null) => void> = new Map()

vi.mock('./date-picker-enhanced', () => ({
  DatePickerEnhanced: ({
    value,
    onChange,
    placeholder,
    disabled,
    'aria-label': ariaLabel,
  }: {
    value: string | null
    onChange: (date: string | null) => void
    placeholder?: string
    disabled?: boolean
    'aria-label'?: string
  }) => {
    // Store the onChange handler for direct invocation in tests
    if (ariaLabel) {
      onChangeHandlers.set(ariaLabel, onChange)
    }
    return (
      <input
        type="text"
        data-testid={`date-input-${ariaLabel}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    )
  },
}))

// Helper to simulate date picker change
function simulateDateChange(ariaLabel: string, newValue: string | null) {
  const handler = onChangeHandlers.get(ariaLabel)
  if (handler) {
    handler(newValue)
  }
}

describe('DateRangeInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    onChangeHandlers.clear()
  })

  describe('Initial Props Population', () => {
    it('should populate inputs with initial fromValue and toValue props', async () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        const fromInput = screen.getByTestId('date-input-Start date')
        const toInput = screen.getByTestId('date-input-End date')

        expect(fromInput).toHaveValue('2026-01-02')
        expect(toInput).toHaveValue('2026-01-09')
      })
    })

    it('should handle empty initial props', () => {
      render(
        <DateRangeInput
          fromValue={null}
          toValue={null}
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      const fromInput = screen.getByTestId('date-input-Start date')
      const toInput = screen.getByTestId('date-input-End date')

      expect(fromInput).toHaveValue('')
      expect(toInput).toHaveValue('')
    })

    it('should treat empty string as null', async () => {
      render(
        <DateRangeInput
          fromValue=""
          toValue=""
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      const fromInput = screen.getByTestId('date-input-Start date')
      const toInput = screen.getByTestId('date-input-End date')

      expect(fromInput).toHaveValue('')
      expect(toInput).toHaveValue('')
    })
  })

  describe('Props Change Re-sync', () => {
    it('should re-sync when props change after mount (simulating form.reset)', async () => {
      const { rerender } = render(
        <DateRangeInput
          fromValue={null}
          toValue={null}
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      // Initially empty
      expect(screen.getByTestId('date-input-Start date')).toHaveValue('')
      expect(screen.getByTestId('date-input-End date')).toHaveValue('')

      // Simulate form.reset() by changing props
      rerender(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('date-input-Start date')).toHaveValue('2026-01-02')
        expect(screen.getByTestId('date-input-End date')).toHaveValue('2026-01-09')
      })
    })

    it('should not re-sync when props remain the same', async () => {
      const { rerender } = render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('date-input-Start date')).toHaveValue('2026-01-02')
      })

      // Clear mock to track new calls
      mockOnChange.mockClear()

      // Re-render with same props
      rerender(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      // Values should still be correct, no onChange called
      expect(screen.getByTestId('date-input-Start date')).toHaveValue('2026-01-02')
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('User Input Handling', () => {
    it('should call onChange when user changes FROM date', async () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('date-input-Start date')).toHaveValue('2026-01-02')
      })

      mockOnChange.mockClear()

      // Simulate user selecting a new date via the date picker
      await act(async () => {
        simulateDateChange('Start date', '2026-02-15')
      })

      expect(mockOnChange).toHaveBeenCalled()
      // onChange should be called with new FROM date and existing TO date
      expect(mockOnChange).toHaveBeenCalledWith('2026-02-15', '2026-01-09')
    })

    it('should call onChange when user changes TO date', async () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('date-input-End date')).toHaveValue('2026-01-09')
      })

      mockOnChange.mockClear()

      // Simulate user selecting a new date via the date picker
      await act(async () => {
        simulateDateChange('End date', '2026-02-20')
      })

      expect(mockOnChange).toHaveBeenCalled()
      // onChange should be called with existing FROM date and new TO date
      expect(mockOnChange).toHaveBeenCalledWith('2026-01-02', '2026-02-20')
    })
  })

  describe('Duration Display', () => {
    it('should show duration when showDuration is true', async () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          showDuration
          formatDuration={(days) => `${days} nights`}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('7 nights')).toBeInTheDocument()
      })
    })

    it('should not show duration when showDuration is false', async () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          showDuration={false}
          fromLabel="Start"
          toLabel="End"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('date-input-Start date')).toHaveValue('2026-01-02')
      })

      expect(screen.queryByText(/nights/)).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable inputs when disabled prop is true', () => {
      render(
        <DateRangeInput
          fromValue="2026-01-02"
          toValue="2026-01-09"
          onChange={mockOnChange}
          disabled
          fromLabel="Start"
          toLabel="End"
        />
      )

      expect(screen.getByTestId('date-input-Start date')).toBeDisabled()
      expect(screen.getByTestId('date-input-End date')).toBeDisabled()
    })
  })
})
