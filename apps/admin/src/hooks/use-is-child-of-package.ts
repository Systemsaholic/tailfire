import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ActivityResponseDto } from '@tailfire/shared-types/api'

/**
 * Hook to check if an activity is a child of a package
 *
 * Used by activity forms to determine if pricing should be disabled.
 * When an activity is linked to a package (via parentActivityId where parent is a package),
 * the pricing is managed at the package level and should not be editable on the child.
 */
export function useIsChildOfPackage(activity?: { parentActivityId?: string | null } | null) {
  const parentActivityId = activity?.parentActivityId

  // Fetch parent activity if parentActivityId exists
  const { data: parentActivity, isLoading } = useQuery({
    queryKey: ['activities', 'parent-check', parentActivityId],
    queryFn: async () => {
      // Use the global activities endpoint to fetch by ID
      return api.get<ActivityResponseDto>(`/activities/${parentActivityId}`)
    },
    enabled: !!parentActivityId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Check if parent is a package
  const isChildOfPackage = !!parentActivityId && parentActivity?.activityType === 'package'

  return {
    isChildOfPackage,
    isLoading: !!parentActivityId && isLoading,
    parentPackageName: isChildOfPackage ? parentActivity?.name : null,
    parentPackageId: isChildOfPackage ? parentActivityId : null,
  }
}
