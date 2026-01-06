'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useSyncHistory, type SyncHistoryEntry } from '@/hooks/use-cruise-sync'
import { format, formatDistanceStrict } from 'date-fns'

function StatusBadge({ status }: { status: SyncHistoryEntry['status'] }) {
  switch (status) {
    case 'running':
      return (
        <Badge variant="default" className="gap-1">
          <Clock className="h-3 w-3" />
          Running
        </Badge>
      )
    case 'completed':
      return (
        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Ban className="h-3 w-3" />
          Cancelled
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return formatDistanceStrict(0, ms, { unit: 'minute' })
}

function HistoryRow({ entry }: { entry: SyncHistoryEntry }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasErrors = entry.errorCount > 0

  return (
    <>
      <TableRow className="group">
        <TableCell className="w-8">
          {hasErrors && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell className="font-medium">
          {format(new Date(entry.startedAt), 'MMM d, yyyy HH:mm')}
        </TableCell>
        <TableCell>
          <StatusBadge status={entry.status} />
        </TableCell>
        <TableCell>{formatDuration(entry.durationMs)}</TableCell>
        <TableCell className="text-right">
          {entry.metrics?.filesProcessed?.toLocaleString() ?? '-'}
        </TableCell>
        <TableCell className="text-right">
          {entry.metrics?.filesSkipped?.toLocaleString() ?? '-'}
        </TableCell>
        <TableCell className="text-right">
          {entry.metrics?.sailingsUpserted?.toLocaleString() ?? '-'}
        </TableCell>
        <TableCell className="text-right">
          {hasErrors ? (
            <span className="flex items-center justify-end gap-1 text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {entry.errorCount}
            </span>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </TableCell>
      </TableRow>

      {/* Expandable Error Details */}
      {hasErrors && isOpen && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Errors ({entry.errorCount})
              </h4>
              <div className="max-h-60 overflow-auto rounded border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">File</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entry.errors.slice(0, 50).map((error, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-mono text-xs break-all max-w-xs">
                          {error.filePath}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {error.errorType}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-red-600 max-w-md truncate">
                          {error.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {entry.errors.length > 50 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                    Showing first 50 of {entry.errors.length} errors
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function SyncHistoryTable() {
  const { data: history, isLoading, error } = useSyncHistory(20)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync History</CardTitle>
        <CardDescription>
          Recent synchronization runs with metrics and error logs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            Failed to load sync history
          </div>
        ) : !history?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            No sync history yet. Start a sync to see results here.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Sailings</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
