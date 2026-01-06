/**
 * Generic combobox options hook for managing selectable options with search filtering.
 *
 * Features:
 * - Handles undefined data gracefully (loading state)
 * - Supports custom values not in the options list
 * - Provides filtered options based on search input
 * - Pure and reusable across different data types
 */

import { useMemo, useState, useCallback } from 'react'

export interface ComboboxOption<T = unknown> {
  value: string
  label: string
  data?: T
}

export interface UseComboboxOptionsProps<T> {
  /**
   * Raw options data (undefined while loading)
   */
  options: ComboboxOption<T>[] | undefined

  /**
   * Currently selected value
   */
  selectedValue?: string | null

  /**
   * Custom label for a value not in options (allows custom entry)
   */
  customLabel?: string | null

  /**
   * Placeholder when no value selected
   */
  placeholder?: string

  /**
   * Empty state message when no options available
   */
  emptyMessage?: string
}

export interface UseComboboxOptionsResult<T> {
  /**
   * Filtered options based on search input
   */
  filteredOptions: ComboboxOption<T>[]

  /**
   * Current search input value
   */
  searchValue: string

  /**
   * Set search input value
   */
  setSearchValue: (value: string) => void

  /**
   * Clear search input
   */
  clearSearch: () => void

  /**
   * Is data still loading (options undefined)
   */
  isLoading: boolean

  /**
   * Display label for current selection
   */
  displayLabel: string

  /**
   * Find option by value
   */
  findOption: (value: string) => ComboboxOption<T> | undefined

  /**
   * Is current value a custom entry (not in options)
   */
  isCustomValue: boolean

  /**
   * All options (unfiltered)
   */
  allOptions: ComboboxOption<T>[]
}

/**
 * Hook for managing combobox options with filtering and custom values
 */
export function useComboboxOptions<T = unknown>(
  props: UseComboboxOptionsProps<T>
): UseComboboxOptionsResult<T> {
  const {
    options,
    selectedValue,
    customLabel,
    placeholder = 'Select...',
    emptyMessage: _emptyMessage = 'No options',
  } = props

  const [searchValue, setSearchValue] = useState('')

  // Memoize all options
  const allOptions = useMemo(() => options || [], [options])

  // Check if loading
  const isLoading = options === undefined

  // Find option by value
  const findOption = useCallback(
    (value: string): ComboboxOption<T> | undefined => {
      return allOptions.find((opt) => opt.value === value)
    },
    [allOptions]
  )

  // Check if current value is custom (not in options)
  const isCustomValue = useMemo(() => {
    if (!selectedValue) return false
    return !findOption(selectedValue)
  }, [selectedValue, findOption])

  // Get display label for current selection
  const displayLabel = useMemo(() => {
    if (!selectedValue) return placeholder

    // First check if value exists in options
    const option = findOption(selectedValue)
    if (option) return option.label

    // If not in options and we have a custom label, use it
    if (customLabel) return customLabel

    // Fallback to the value itself
    return selectedValue
  }, [selectedValue, findOption, customLabel, placeholder])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return allOptions

    const search = searchValue.toLowerCase().trim()
    return allOptions.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(search)
      const valueMatch = option.value.toLowerCase().includes(search)
      return labelMatch || valueMatch
    })
  }, [allOptions, searchValue])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  return {
    filteredOptions,
    searchValue,
    setSearchValue,
    clearSearch,
    isLoading,
    displayLabel,
    findOption,
    isCustomValue,
    allOptions,
  }
}

/**
 * Helper to convert array of items to combobox options
 */
export function toComboboxOptions<T>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T
): ComboboxOption<T>[] {
  return items.map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
    data: item,
  }))
}
