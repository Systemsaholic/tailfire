'use client'

import { useState } from 'react'
import { Trash2, HardDrive, Database, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useStorageStats,
  useCacheStats,
  useCleanupPreview,
  useClearCache,
  useRunPurge,
  useRunCleanup,
} from '@/hooks/use-cruise-sync'
import { format } from 'date-fns'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function MaintenanceCard() {
  const { data: storageStats, isLoading: storageLoading } = useStorageStats()
  const { data: cacheStats, isLoading: cacheLoading } = useCacheStats()
  const { data: cleanupPreview, isLoading: cleanupLoading } = useCleanupPreview(0)

  const clearCacheMutation = useClearCache()
  const runPurgeMutation = useRunPurge()
  const runCleanupMutation = useRunCleanup()

  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)

  const handleClearCache = () => {
    clearCacheMutation.mutate()
  }

  const handleRunPurge = () => {
    runPurgeMutation.mutate()
    setShowPurgeDialog(false)
  }

  const handleRunCleanup = () => {
    runCleanupMutation.mutate(0)
    setShowCleanupDialog(false)
  }

  const isLoading = storageLoading || cacheLoading || cleanupLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Tools</CardTitle>
        <CardDescription>
          Storage management, cache control, and cleanup operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cache Stats */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Reference Data Cache
                  </h4>
                  {cacheStats && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>Entries: {cacheStats.totalEntries.toLocaleString()} / {cacheStats.maxEntries.toLocaleString()}</p>
                      <p>Hit Rate: {(cacheStats.hitRate * 100).toFixed(1)}%</p>
                      <p>Hits/Misses: {cacheStats.hits.toLocaleString()}/{cacheStats.misses.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={clearCacheMutation.isPending}
                >
                  {clearCacheMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Clear Cache
                </Button>
              </div>
              {clearCacheMutation.isSuccess && (
                <p className="mt-2 text-sm text-green-600">Cache cleared successfully</p>
              )}
            </div>

            {/* Raw JSON Storage Stats */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Raw JSON Storage
                  </h4>
                  {storageStats && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>Total Records: {storageStats.totalRecords.toLocaleString()}</p>
                      <p>Total Size: {formatBytes(storageStats.totalSizeBytes)}</p>
                      <p>Avg Size: {formatBytes(storageStats.avgSizeBytes)}</p>
                      {storageStats.expiredCount > 0 && (
                        <p className="text-yellow-600">
                          Expired: {storageStats.expiredCount.toLocaleString()} records
                        </p>
                      )}
                      {storageStats.expiringIn24HoursCount > 0 && (
                        <p className="text-muted-foreground">
                          Expiring soon: {storageStats.expiringIn24HoursCount.toLocaleString()} records
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!storageStats?.expiredCount || runPurgeMutation.isPending}
                    >
                      {runPurgeMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Purge Expired
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Purge Expired Records
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {storageStats?.expiredCount.toLocaleString()} expired raw JSON records.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRunPurge}>
                        Purge Records
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {runPurgeMutation.isSuccess && (
                <p className="mt-2 text-sm text-green-600">
                  Purged {(runPurgeMutation.data as { deletedCount?: number })?.deletedCount ?? 0} expired records
                </p>
              )}
            </div>

            {/* Past Sailing Cleanup */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Past Sailing Cleanup
                  </h4>
                  {cleanupPreview && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>Sailings to delete: {cleanupPreview.sailingsToDelete.toLocaleString()}</p>
                      <p>Related stops: {cleanupPreview.stopsToDelete.toLocaleString()}</p>
                      <p>Related prices: {cleanupPreview.pricesToDelete.toLocaleString()}</p>
                      <p>Cutoff: {format(new Date(cleanupPreview.cutoffDate), 'MMM d, yyyy')}</p>
                      {cleanupPreview.oldestEndDate && (
                        <p>Oldest sailing: {format(new Date(cleanupPreview.oldestEndDate), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                  )}
                </div>
                <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!cleanupPreview?.sailingsToDelete || runCleanupMutation.isPending}
                    >
                      {runCleanupMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Run Cleanup
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Clean Up Past Sailings
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {cleanupPreview?.sailingsToDelete.toLocaleString()} past sailings
                        and their associated data (stops, prices, regions).
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRunCleanup}>
                        Run Cleanup
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {runCleanupMutation.isSuccess && (
                <p className="mt-2 text-sm text-green-600">
                  Cleaned up {(runCleanupMutation.data as { sailingsDeleted?: number })?.sailingsDeleted ?? 0} past sailings
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
