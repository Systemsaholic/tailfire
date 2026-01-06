import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ContactAvatarProps {
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
  xl: 'h-24 w-24 text-2xl'
}

export function ContactAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 'md',
  className = ''
}: ContactAvatarProps) {
  const initials = getInitials(firstName, lastName)

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || 'Contact'}
        />
      )}
      <AvatarFallback className="bg-phoenix-gold-500 text-white font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
