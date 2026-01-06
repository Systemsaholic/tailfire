import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Tailfire Admin
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Next-generation travel agency management system
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/api-status"
            className="rounded-md border border-input px-6 py-3 hover:bg-accent"
          >
            API Status
          </Link>
        </div>
      </div>
    </div>
  )
}
