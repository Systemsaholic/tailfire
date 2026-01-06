'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, ShieldCheck, Clock, LogOut, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/auth-provider'
import { useMyProfile } from '@/hooks/use-user-profile'
import { createClient } from '@/lib/supabase/client'

interface PasswordFormData {
  newPassword: string
  confirmPassword: string
}

export function SecurityTab() {
  const { toast } = useToast()
  const { user, signOut } = useAuth()
  const { data: profile } = useMyProfile()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showReauthError, setShowReauthError] = useState(false)

  const form = useForm<PasswordFormData>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordFormData) => {
    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      form.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      })
      return
    }

    // Validate minimum password length
    if (data.newPassword.length < 8) {
      form.setError('newPassword', {
        type: 'manual',
        message: 'Password must be at least 8 characters',
      })
      return
    }

    setIsUpdating(true)
    setShowReauthError(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) {
        // Check for reauthentication or session-related errors
        const isReauthError =
          error.message.toLowerCase().includes('reauthentication') ||
          error.message.toLowerCase().includes('session') ||
          error.code === 'session_expired' ||
          error.name === 'AuthSessionMissingError' ||
          error.message.toLowerCase().includes('auth session missing')

        if (isReauthError) {
          setShowReauthError(true)
        } else {
          toast({
            title: 'Error',
            description: error.message || 'Failed to update password. Please try again.',
            variant: 'destructive',
          })
        }
        return
      }

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      })
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  // Format last login date
  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-sm text-muted-foreground">
                  {formatLastLogin(profile?.lastLoginAt ?? null)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reauth Error Alert */}
      {showReauthError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Session Expired</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>
              For security reasons, please sign out and sign back in before changing your password.
            </p>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-fit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...form.register('newPassword')}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register('confirmPassword')}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Future: 2FA Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
