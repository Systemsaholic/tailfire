/**
 * User Hook
 *
 * Provides convenient access to the current user and auth claims.
 * Use this hook in components that need user information.
 */

import { useAuth, type AuthClaims } from '@/providers/auth-provider'
import type { User } from '@supabase/supabase-js'

interface UseUserReturn {
  user: User | null
  claims: AuthClaims | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  agencyId: string | null
  userId: string | null
}

export function useUser(): UseUserReturn {
  const { user, claims, isLoading } = useAuth()

  return {
    user,
    claims,
    isLoading,
    isAuthenticated: !!user && !!claims,
    isAdmin: claims?.role === 'admin',
    agencyId: claims?.agencyId ?? null,
    userId: claims?.userId ?? null,
  }
}
