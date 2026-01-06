import { useRelationships } from './use-relationships'
import type { ContactRelationshipResponseDto } from '@tailfire/shared-types/api'

/**
 * Hook to fetch relationship suggestions for travelers
 *
 * Uses the existing GET /contacts/:contactId/relationships endpoint
 * to fetch related contacts who can be suggested as travelers
 *
 * @param contactId - The primary contact ID to fetch relationships for
 * @param existingContactIds - Optional Set of contact IDs already added as travelers (to filter out)
 * @param includeAllRelationships - If true, fetches all relationship categories; if false, only family (default: false)
 */
export function useRelationshipSuggestions(
  contactId: string | null | undefined,
  existingContactIds?: Set<string>,
  includeAllRelationships: boolean = false
) {
  const {
    data: relationships,
    isLoading,
    error,
  } = useRelationships(contactId ?? null, includeAllRelationships ? undefined : { category: 'family' })

  // Transform relationships into a format suitable for traveler suggestions
  const suggestions = relationships
    ?.map((rel: ContactRelationshipResponseDto) => {
      // Determine which contact is the "other" contact (not the primary contact)
      // Guard: if contactId isn't in the relationship, skip it
      if (!contactId || (rel.contactId1 !== contactId && rel.contactId2 !== contactId)) {
        return null
      }

      const relatedContactId = rel.contactId1 === contactId ? rel.contactId2 : rel.contactId1

      // Determine the relationship label from the requesting contact's perspective
      const relationshipLabel =
        rel.contactId1 === contactId
          ? rel.labelForContact1 // Label that describes contactId2 from contactId1's perspective
          : rel.labelForContact2 // Label that describes contactId1 from contactId2's perspective

      return {
        relationshipId: rel.id,
        contactId: relatedContactId,
        name:
          rel.relatedContact?.firstName && rel.relatedContact?.lastName
            ? `${rel.relatedContact.firstName} ${rel.relatedContact.lastName}`
            : rel.relatedContact?.firstName || rel.relatedContact?.lastName || 'Unknown',
        relationshipType: relationshipLabel || rel.category,
        category: rel.category,
        contact: rel.relatedContact,
      }
    })
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => suggestion !== null)
    // Filter out contacts already added as travelers
    .filter((suggestion) => !existingContactIds || !existingContactIds.has(suggestion.contactId))

  return {
    suggestions: suggestions || [],
    isLoading,
    error,
    hasRelationships: (suggestions?.length || 0) > 0,
  }
}
