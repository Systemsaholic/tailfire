import { Percent } from 'lucide-react'

export default function CommissionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-tern-gray-100 p-4 mb-4">
        <Percent className="h-8 w-8 text-tern-gray-400" />
      </div>
      <h1 className="text-2xl font-semibold text-tern-gray-900 mb-2">Commission</h1>
      <p className="text-tern-gray-500 max-w-md">
        Commission tracking features are coming soon. You&apos;ll be able to view and manage supplier commissions here.
      </p>
    </div>
  )
}
