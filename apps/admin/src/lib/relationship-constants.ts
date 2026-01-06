/**
 * Relationship Category Constants
 *
 * Shared constants for contact relationship categories, colors, and labels.
 * Used across relationship-dialog.tsx and relationships-card.tsx to ensure
 * consistent styling and labeling.
 */

export const RELATIONSHIP_CATEGORIES = [
  { value: 'family', label: 'Family' },
  { value: 'business', label: 'Business' },
  { value: 'travel_companions', label: 'Travel Companions' },
  { value: 'group', label: 'Group' },
  { value: 'other', label: 'Other' },
  { value: 'custom', label: 'Custom' },
] as const

export type RelationshipCategory = typeof RELATIONSHIP_CATEGORIES[number]['value']

/**
 * Category color mappings for badges
 * Uses Tailwind classes for consistent theming
 */
export const RELATIONSHIP_CATEGORY_COLORS: Record<string, string> = {
  family: 'bg-pink-100 text-pink-800 border-pink-200',
  business: 'bg-blue-100 text-blue-800 border-blue-200',
  travel_companions: 'bg-purple-100 text-purple-800 border-purple-200',
  group: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
  custom: 'bg-amber-100 text-amber-800 border-amber-200',
}

/**
 * Category label mappings for display
 */
export const RELATIONSHIP_CATEGORY_LABELS: Record<string, string> = {
  family: 'Family',
  business: 'Business',
  travel_companions: 'Travel Companions',
  group: 'Group',
  other: 'Other',
  custom: 'Custom',
}

/**
 * Get display label for a category
 */
export function getRelationshipCategoryLabel(category: string): string {
  return RELATIONSHIP_CATEGORY_LABELS[category] || category
}

/**
 * Get color classes for a category badge
 */
export function getRelationshipCategoryColor(category: string): string {
  return RELATIONSHIP_CATEGORY_COLORS[category] || RELATIONSHIP_CATEGORY_COLORS.other!
}
