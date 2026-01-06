/**
 * Relationship Utilities
 *
 * Helper functions for working with contact relationships
 */

/**
 * Infer traveler type from relationship label
 *
 * Uses case-insensitive matching to determine if a relationship
 * indicates a child or infant traveler, otherwise defaults to adult.
 *
 * @param relationshipLabel - The relationship label (e.g., "wife", "son", "daughter")
 * @returns The inferred traveler type
 *
 * @example
 * inferTravelerTypeFromRelationship("Son") // returns "child"
 * inferTravelerTypeFromRelationship("infant") // returns "infant"
 * inferTravelerTypeFromRelationship("Wife") // returns "adult"
 * inferTravelerTypeFromRelationship(null) // returns "adult"
 */
export function inferTravelerTypeFromRelationship(
  relationshipLabel: string | null | undefined
): 'adult' | 'child' | 'infant' {
  // Default to adult if no label provided
  if (!relationshipLabel) {
    return 'adult'
  }

  // Normalize: lowercase and trim
  const normalized = relationshipLabel.toLowerCase().trim()

  // Check for infant relationships (most specific first)
  const infantTerms = ['infant', 'infants', 'baby', 'babies', 'newborn']
  if (infantTerms.some((term) => normalized.includes(term))) {
    return 'infant'
  }

  // Check for child relationships
  const childTerms = ['child', 'children', 'son', 'daughter', 'nephew', 'niece', 'kid', 'kids']
  if (childTerms.some((term) => normalized.includes(term))) {
    return 'child'
  }

  // Default to adult
  return 'adult'
}
