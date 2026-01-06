'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserListItemDto } from '@tailfire/shared-types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateUser, useUser } from '@/hooks/use-users'
import { useToast } from '@/hooks/use-toast'

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.enum(['admin', 'user']),
  commissionSplitType: z.enum(['percentage', 'fixed']),
  commissionSplitValue: z.coerce.number().min(0),
}).refine(
  (data) => data.commissionSplitType !== 'percentage' || data.commissionSplitValue <= 100,
  { message: 'Percentage cannot exceed 100%', path: ['commissionSplitValue'] }
)

type EditUserForm = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
  user: UserListItemDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isCurrentUser: boolean
}

export function EditUserDialog({ user, open, onOpenChange, isCurrentUser }: EditUserDialogProps) {
  const { data: userDetail } = useUser(user?.id ?? null)
  const updateUser = useUpdateUser()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      role: 'user',
      commissionSplitType: 'percentage',
      commissionSplitValue: 0,
    },
  })

  const role = watch('role')
  const commissionSplitType = watch('commissionSplitType')

  useEffect(() => {
    if (userDetail) {
      reset({
        firstName: userDetail.firstName || '',
        lastName: userDetail.lastName || '',
        phone: userDetail.phone || '',
        role: userDetail.role,
        commissionSplitType: userDetail.commissionSettings?.splitType || 'percentage',
        commissionSplitValue: userDetail.commissionSettings?.splitValue || 0,
      })
    }
  }, [userDetail, reset])

  const onSubmit = async (data: EditUserForm) => {
    if (!user) return

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          role: isCurrentUser ? undefined : data.role,
          commissionSettings: {
            splitType: data.commissionSplitType,
            splitValue: data.commissionSplitValue,
          },
        },
      })
      toast({
        title: 'User updated',
        description: `${data.firstName} ${data.lastName} has been updated`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value as 'admin' | 'user')}
                disabled={isCurrentUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {isCurrentUser && (
                <p className="text-xs text-muted-foreground">You cannot change your own role</p>
              )}
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Commission Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={commissionSplitType}
                  onValueChange={(value) => setValue('commissionSplitType', value as 'percentage' | 'fixed')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={commissionSplitType === 'percentage' ? 100 : undefined}
                    step={commissionSplitType === 'percentage' ? 1 : 0.01}
                    {...register('commissionSplitValue')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {commissionSplitType === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
              {errors.commissionSplitValue && (
                <p className="text-sm text-destructive">{errors.commissionSplitValue.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
