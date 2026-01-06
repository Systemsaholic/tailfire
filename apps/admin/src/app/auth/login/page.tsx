'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Column - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-3">
            <Image
              src="/logo.png"
              alt="Tailfire"
              width={64}
              height={64}
              className="h-16 w-16"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Tailfire
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Travel Agency Management Platform
              </p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-800">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-100">
            <Suspense fallback={<div className="h-48 animate-pulse bg-slate-100 rounded" />}>
              <LoginForm />
            </Suspense>
          </div>

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
