'use client'

import { useState } from 'react'
import { Play, Square, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useSyncStatus,
  useConnectionTest,
  useStartSync,
  useCancelSync,
  useAvailableYears,
  type SyncOptions,
} from '@/hooks/use-cruise-sync'
import { formatDistanceToNow } from 'date-fns'

export function SyncStatusCard() {
  const { data: status, isLoading: statusLoading } = useSyncStatus()
  const { data: connectionResult, refetch: testConnection, isFetching: testingConnection } = useConnectionTest()
  const { data: availableYearsData, isLoading: yearsLoading } = useAvailableYears()
  const startSyncMutation = useStartSync()
  const cancelSyncMutation = useCancelSync()

  // Sync options state
  const [targetYear, setTargetYear] = useState<string>('all')
  const [targetMonth, setTargetMonth] = useState<string>('all')
  const [forceFullSync, setForceFullSync] = useState(false)
  const [dryRun, setDryRun] = useState(false)

  const isRunning = status?.inProgress || false
  const isCancelling = status?.cancelRequested || false
  const progress = status?.progress

  const handleStartSync = () => {
    const options: SyncOptions = {}

    if (targetYear !== 'all') {
      options.targetYear = parseInt(targetYear, 10)
    }
    if (targetMonth !== 'all') {
      options.targetMonth = parseInt(targetMonth, 10)
    }
    if (forceFullSync) {
      options.forceFullSync = true
    }
    if (dryRun) {
      options.dryRun = true
    }

    startSyncMutation.mutate(options)
  }

  const handleCancelSync = () => {
    cancelSyncMutation.mutate()
  }

  const handleTestConnection = () => {
    testConnection()
  }

  // Calculate progress percentage
  const progressPercent = progress?.filesFound && progress.filesProcessed
    ? Math.round((progress.filesProcessed / progress.filesFound) * 100)
    : 0

  // Use available years from FTP or fall back to current year ± 2
  const currentYear = new Date().getFullYear()
  const fallbackYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const years = availableYearsData?.years?.length ? availableYearsData.years : fallbackYears

  // Month names
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Sync Status
              {isRunning && (
                <Badge variant="default" className="ml-2">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Running
                </Badge>
              )}
              {isCancelling && (
                <Badge variant="secondary" className="ml-2">
                  Cancelling...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Control and monitor cruise data synchronization from Traveltek FTP
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection || isRunning}
          >
            {testingConnection ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : connectionResult?.success ? (
              <Wifi className="mr-2 h-4 w-4 text-green-500" />
            ) : connectionResult?.success === false ? (
              <WifiOff className="mr-2 h-4 w-4 text-red-500" />
            ) : (
              <Wifi className="mr-2 h-4 w-4" />
            )}
            Test Connection
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section (visible when running) */}
        {isRunning && progress && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span>Processing files...</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Files Found:</span>{' '}
                <span className="font-medium">{progress.filesFound.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Processed:</span>{' '}
                <span className="font-medium">{progress.filesProcessed.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Failed:</span>{' '}
                <span className="font-medium text-red-600">{progress.filesFailed}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sailings Updated:</span>{' '}
                <span className="font-medium">{progress.sailingsUpserted.toLocaleString()}</span>
              </div>
              {progress.startedAt && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Started:</span>{' '}
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(progress.startedAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Year</Label>
            <Select value={targetYear} onValueChange={setTargetYear} disabled={isRunning || yearsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={yearsLoading ? 'Loading years...' : 'All Years'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Month</Label>
            <Select
              value={targetMonth}
              onValueChange={setTargetMonth}
              disabled={isRunning || targetYear === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sync Mode Options */}
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="force-full"
              checked={forceFullSync}
              onCheckedChange={setForceFullSync}
              disabled={isRunning}
            />
            <Label htmlFor="force-full" className="text-sm">
              Force Full Sync (ignore delta)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
              disabled={isRunning}
            />
            <Label htmlFor="dry-run" className="text-sm">
              Dry Run (preview only)
            </Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStartSync}
              disabled={startSyncMutation.isPending || statusLoading}
              className="w-40"
            >
              {startSyncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {dryRun ? 'Preview Sync' : 'Start Sync'}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleCancelSync}
              disabled={isCancelling || cancelSyncMutation.isPending}
              className="w-40"
            >
              {cancelSyncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Cancel Sync
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isRunning}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Connection Test Result */}
        {connectionResult && !isRunning && (
          <div className={`text-sm p-3 rounded-lg ${connectionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {connectionResult.success ? (
              connectionResult.skipped ? (
                'Connection test skipped (sync in progress)'
              ) : (
                'FTP connection successful'
              )
            ) : (
              `Connection failed: ${(connectionResult.info as { error?: string })?.error || 'Unknown error'}`
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
