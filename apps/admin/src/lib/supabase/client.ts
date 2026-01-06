/**
 * Supabase Browser Client
 *
 * Use this client in Client Components (use client directive).
 * For Server Components, use the server.ts client instead.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
