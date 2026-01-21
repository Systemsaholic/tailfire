import { Mail } from 'lucide-react'

export default function EmailsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-tern-gray-100 p-4 mb-4">
        <Mail className="h-8 w-8 text-tern-gray-400" />
      </div>
      <h1 className="text-2xl font-semibold text-tern-gray-900 mb-2">Emails</h1>
      <p className="text-tern-gray-500 max-w-md">
        Email management features are coming soon. You&apos;ll be able to view sent emails and manage templates here.
      </p>
    </div>
  )
}
