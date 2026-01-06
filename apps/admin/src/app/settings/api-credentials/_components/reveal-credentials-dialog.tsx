'use client'

import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { CredentialSecretsDto } from '@tailfire/shared-types/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRevealCredential } from '@/hooks/use-api-credentials'
import { useToast } from '@/hooks/use-toast'

interface RevealCredentialsDialogProps {
  credentialId: string | null
  credentialName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevealCredentialsDialog({
  credentialId,
  credentialName,
  open,
  onOpenChange,
}: RevealCredentialsDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [revealed, setRevealed] = useState<CredentialSecretsDto | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const revealMutation = useRevealCredential()
  const { toast } = useToast()

  const handleReveal = async () => {
    if (!credentialId) return

    try {
      const data = await revealMutation.mutateAsync(credentialId)
      setRevealed(data)
      setConfirmed(true)
      toast({
        title: 'Credentials revealed',
        description: 'Decrypted credentials are now visible.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reveal credentials. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: 'Copied',
      description: `${field} copied to clipboard`,
    })
  }

  const handleClose = () => {
    setConfirmed(false)
    setRevealed(null)
    setShowSecrets(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reveal Credentials</DialogTitle>
          <DialogDescription>
            View decrypted credentials for {credentialName}
          </DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-md bg-red-50 border border-red-200">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-900 space-y-2">
                <p className="font-semibold text-base">Security Warning</p>
                <p>
                  You are about to reveal sensitive encrypted credentials. This action should only be performed when absolutely necessary.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ensure you are in a secure environment</li>
                  <li>Do not share these credentials via insecure channels</li>
                  <li>Close this dialog when you&apos;re done</li>
                  <li>Consider rotating credentials if they may have been compromised</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReveal}
                disabled={revealMutation.isPending}
              >
                {revealMutation.isPending ? 'Revealing...' : 'I Understand, Reveal Credentials'}
              </Button>
            </div>
          </div>
        ) : revealed ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Credentials are decrypted and visible below
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(revealed.decryptedCredentials).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key}</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets ? 'text' : 'password'}
                      value={String(value)}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(key, String(value))}
                    >
                      {copiedField === key ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
