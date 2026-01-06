import { redirect } from 'next/navigation'

/**
 * Library Index Page
 *
 * Redirects to the first library section (Cruises).
 * The side navigation in layout.tsx provides access to all library sections.
 */
export default function LibraryPage() {
  redirect('/library/cruises')
}
