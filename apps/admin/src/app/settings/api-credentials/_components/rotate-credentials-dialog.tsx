'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Info } from 'lucide-react'
import { RotateCredentialDto } from '@tailfire/shared-types/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePickerEnhanced } from '@/components/ui/date-picker-enhanced'
import { useRotateCredential } from '@/hooks/use-api-credentials'
import { useToast } from '@/hooks/use-toast'

const rotateFormSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  serviceRoleKey: z.string().min(1, 'Service role key is required'),
  expiresAt: z.string().optional().or(z.literal('')),
})

type RotateFormValues = z.infer<typeof rotateFormSchema>

interface RotateCredentialsDialogProps {
  credentialId: string | null
  credentialName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RotateCredentialsDialog({
  credentialId,
  credentialName,
  open,
  onOpenChange,
}: RotateCredentialsDialogProps) {
  const form = useForm<RotateFormValues>({
    resolver: zodResolver(rotateFormSchema),
    defaultValues: {
      url: '',
      serviceRoleKey: '',
      expiresAt: '',
    },
  })

  const rotateMutation = useRotateCredential()
  const { toast } = useToast()

  const onSubmit = async (data: RotateFormValues) => {
    if (!credentialId) return

    try {
      const dto: RotateCredentialDto = {
        credentials: {
          url: data.url,
          serviceRoleKey: data.serviceRoleKey,
        },
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
      }

      await rotateMutation.mutateAsync({ id: credentialId, data: dto })
      toast({
        title: 'Credentials rotated',
        description: 'New credentials have been encrypted and stored. The old version has been deactivated.',
      })
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rotate credentials. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rotate Credentials</DialogTitle>
          <DialogDescription>
            Create a new version of {credentialName} with updated credentials
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">How Rotation Works</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>A new version will be created and marked as active</li>
              <li>The current version will be kept but marked as inactive</li>
              <li>You can rollback to the previous version if needed</li>
              <li>Services using these credentials should be restarted</li>
            </ul>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                New Credentials
              </h3>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supabase URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://your-project.supabase.co"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceRoleKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Role Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter the new service_role key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePickerEnhanced
                      value={field.value || null}
                      onChange={(date) => field.onChange(date || '')}
                      placeholder="Select expiration date"
                    />
                  </FormControl>
                  <FormDescription>
                    Set a reminder for when these credentials should be rotated again
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rotateMutation.isPending}
              >
                {rotateMutation.isPending ? 'Rotating...' : 'Rotate Credentials'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
