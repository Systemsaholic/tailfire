'use client'

/**
 * Payments Data Table
 *
 * ShadCN Data Table implementation for displaying trip payments in TERN style
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ActivityIconBadge } from '@/components/ui/activity-icon-badge'
import { DollarSign } from 'lucide-react'

import { ActivityResponseDto } from '@tailfire/shared-types'

function getPaymentTypeLabel(_activity: ActivityResponseDto): string {
  // For now, showing estimated cost as expected payment
  // TODO: Fetch actual payment schedule and show deposit/final/installment
  return 'Full Amount'
}

function getPaymentStatus(activity: ActivityResponseDto): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (activity.status === 'confirmed') {
    return { label: 'Pending', variant: 'default' }
  }
  if (activity.status === 'proposed') {
    return { label: 'Upcoming', variant: 'secondary' }
  }
  return { label: 'Not Set', variant: 'outline' }
}

function formatCostCents(costCents: number | null | undefined, currency: string): string {
  if (!costCents) return `${currency} 0.00`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(costCents / 100)
}

function formatDate(date: string | null): string {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface PaymentsDataTableProps {
  activities: ActivityResponseDto[]
  currency: string
  tripId: string
}

export function PaymentsDataTable({ activities, tripId }: PaymentsDataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleRowClick = (activityId: string, event: React.MouseEvent) => {
    // Prevent navigation if clicking on interactive elements
    const target = event.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('a')
    ) {
      return
    }

    // Guard against missing activityId
    if (!activityId || !tripId) {
      console.warn('Missing activityId or tripId for navigation', { activityId, tripId })
      return
    }

    router.push(`/trips/${tripId}/activities/${activityId}/edit?tab=booking`)
  }

  const expectedPaymentsColumns: ColumnDef<ActivityResponseDto>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Item',
      cell: ({ row }) => {
        const activity = row.original

        return (
          <div className="flex items-center gap-2">
            <ActivityIconBadge type={activity.activityType} size="md" />
            <span className="font-medium">{activity.name}</span>
          </div>
        )
      },
    },
    {
      id: 'payment',
      header: 'Payment',
      cell: ({ row }) => {
        const activity = row.original
        return <span className="text-gray-600">{getPaymentTypeLabel(activity)}</span>
      },
    },
    {
      id: 'due',
      header: 'Due',
      cell: ({ row }) => {
        const activity = row.original
        // TODO: Fetch actual payment schedule due dates
        return <span className="text-gray-500">{formatDate(activity.startDatetime)}</span>
      },
    },
    {
      id: 'expected',
      header: 'Expected',
      cell: ({ row }) => {
        const activity = row.original
        return <span className="font-medium">{formatCostCents(activity.pricing?.totalPriceCents, activity.pricing?.currency || activity.currency)}</span>
      },
    },
    {
      id: 'remaining',
      header: 'Remaining',
      cell: ({ row }) => {
        const activity = row.original
        // TODO: Calculate remaining based on actual payments
        return <span className="text-amber-600">{formatCostCents(activity.pricing?.totalPriceCents, activity.pricing?.currency || activity.currency)}</span>
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const activity = row.original
        const status = getPaymentStatus(activity)
        return <Badge variant={status.variant as any}>{status.label}</Badge>
      },
    },
  ]

  // Filter out child activities (port_info under cruises, options under activities)
  // Memoize to prevent infinite loops
  const parentActivities = React.useMemo(
    () => activities.filter(a => !a.parentActivityId),
    [activities]
  )

  const table = useReactTable({
    data: parentActivities,
    columns: expectedPaymentsColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-6">
      {/* Expected Payments Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Expected Payments</h2>
          <div className="flex gap-3">
            <Button variant="outline">Generate Invoice</Button>
            <Button>New Item</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const activity = row.original

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={(e) => handleRowClick(activity.id, e)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={expectedPaymentsColumns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500">No expected payments yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Payments will appear here once you set up payment schedules
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Past Payments Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Past Payments and Authorizations</h2>
        </div>

        {/* Placeholder Content */}
        <div className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">No past payments recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Payment history will appear here once payments are recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
