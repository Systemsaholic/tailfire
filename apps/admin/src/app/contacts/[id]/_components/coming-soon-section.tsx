import { type LucideIcon, Clock } from 'lucide-react'

interface ComingSoonSectionProps {
  title: string
  description: string
  icon?: LucideIcon
}

export function ComingSoonSection({
  title,
  description,
  icon: Icon = Clock
}: ComingSoonSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-tern-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-tern-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-tern-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-tern-gray-600 text-center max-w-md">
        {description}
      </p>
    </div>
  )
}
