'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, CheckCircle, Flame, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/request-password-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send reset email')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-orange-500 text-white shadow-lg">
              <Flame className="h-9 w-9" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Tailfire
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Travel Agency Management Platform
              </p>
            </div>
          </div>

          {isSubmitted ? (
            // Success State
            <>
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                  Check Your Email
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  We&apos;ve sent you a password reset link
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-100">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    If an account exists for <strong className="text-slate-900">{email}</strong>,
                    you&apos;ll receive an email with instructions to reset your password.
                  </p>
                  <p className="text-xs text-slate-500">
                    Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            // Form State
            <>
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-800">
                  Forgot Password?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your email to receive a reset link
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-100">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 focus-visible:ring-orange-500"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    size="lg"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Security Disclaimer */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  Private System Notice
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This is a private web application for authorized Tailfire personnel only.
                  Unauthorized access is strictly prohibited. All access attempts are logged.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Tailfire. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column - Hero Image */}
      <div className="hidden lg:block lg:flex-1 relative bg-gradient-to-br from-orange-400 to-orange-600">
        <Image
          src="/beach-sunset.jpg"
          alt="Tropical beach at sunset with palm trees silhouetted against orange sky"
          fill
          className="object-cover"
          loading="lazy"
          quality={85}
          sizes="50vw"
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)'
          }}
        />

        {/* Tagline Overlay */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2
            className="text-4xl font-bold mb-2 uppercase tracking-wide"
            style={{
              fontFamily: 'serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            Ignite Your Journey
          </h2>
          <p
            className="text-lg"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            Streamline bookings, delight travelers, grow your travel business.
          </p>
        </div>
      </div>
    </div>
  )
}
