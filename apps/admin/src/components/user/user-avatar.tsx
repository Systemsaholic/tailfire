/**
 * UserAvatar Component
 *
 * Displays user avatar with initials fallback.
 * Uses Tailfire orange branding for fallback background.
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.[0]?.toUpperCase() || ''
  const last = lastName?.[0]?.toUpperCase() || ''

  if (first && last) {
    return `${first}${last}`
  }

  return first || last || '?'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const initials = getInitials(firstName, lastName)
  const altText = `${firstName || ''} ${lastName || ''}`.trim() || 'User'

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={altText}
        />
      )}
      <AvatarFallback className="bg-orange-500 text-white font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
