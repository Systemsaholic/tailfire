/**
 * Sign Out Route
 *
 * Handles user logout by clearing the session and redirecting to login.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = new URL('/auth/login', request.url)
  return NextResponse.redirect(url, {
    status: 302,
  })
}
