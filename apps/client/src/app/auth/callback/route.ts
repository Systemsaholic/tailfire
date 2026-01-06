import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // Handle PKCE flow (OAuth, magic links)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Handle token-based flows (invites, recovery)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
    })
    if (!error) {
      // For password recovery, redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Handle hash fragment flows (implicit grants)
  // These are handled client-side, redirect to let client handle
  const hash = new URL(request.url).hash
  if (hash && hash.includes('access_token')) {
    return NextResponse.redirect(`${origin}${next}${hash}`)
  }

  // Auth failed, redirect to error page or login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
