'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SharedTrip {
  id: string
  name: string
  description: string | null
  tripType: string | null
  startDate: string | null
  endDate: string | null
  coverPhotoUrl: string | null
}

export default function SharedTripPage() {
  const { token } = useParams<{ token: string }>()
  const [trip, setTrip] = useState<SharedTrip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1'
    fetch(`${apiUrl}/trips/share/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Trip not found')
        return res.json()
      })
      .then(setTrip)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Trip Not Found</h1>
          <p className="text-muted-foreground">This trip is no longer available or the link has expired.</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {trip.coverPhotoUrl && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={trip.coverPhotoUrl}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>

        {(trip.startDate || trip.endDate) && (
          <p className="text-muted-foreground mb-4">
            {formatDate(trip.startDate)}
            {trip.startDate && trip.endDate && ' — '}
            {formatDate(trip.endDate)}
          </p>
        )}

        {trip.description && (
          <p className="text-lg leading-relaxed">{trip.description}</p>
        )}
      </div>
    </div>
  )
}
