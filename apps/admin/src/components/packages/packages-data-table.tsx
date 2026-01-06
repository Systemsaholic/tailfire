'use client'

/**
 * Bookings Data Table
 *
 * ShadCN Data Table implementation for displaying bookings in TERN style
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
import {
  ChevronDown,
  ChevronRight,
  Activity as ActivityIcon,
} from 'lucide-react'

import {
  ActivityResponseDto,
  TripBookingStatusResponseDto,
  ActivityBookingStatusDto,
} from '@tailfire/shared-types'

type PaymentBadgeInfo = { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }

function getPaymentStatusInfo(status: ActivityBookingStatusDto | null): PaymentBadgeInfo {
  if (!status || !status.hasPaymentSchedule) {
    return { label: 'Not Set Up', variant: 'outline' }
  }

  switch (status.paymentStatus) {
    case 'paid':
      return { label: 'Paid', variant: 'default' }
    case 'partial':
      return { label: 'Partially Paid', variant: 'secondary' }
    case 'overdue':
      return { label: 'Overdue', variant: 'destructive' }
    case 'pending':
      return { label: 'Pending', variant: 'outline' }
    default:
      return { label: 'Not Set Up', variant: 'outline' }
  }
}

function getCommissionStatusInfo(status: ActivityBookingStatusDto | null): PaymentBadgeInfo {
  if (!status || status.commissionTotalCents === 0) {
    return { label: 'No Commission', variant: 'outline' }
  }

  switch (status.commissionStatus) {
    case 'received':
      return { label: 'Received', variant: 'default' }
    case 'pending':
      return { label: 'Pending', variant: 'secondary' }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'outline' }
    default:
      return { label: 'Pending', variant: 'secondary' }
  }
}

function formatCostCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100)
}

interface PackagesDataTableProps {
  activities: ActivityResponseDto[]
  currency: string
  tripId: string
  bookingStatus?: TripBookingStatusResponseDto
}

export function PackagesDataTable({ activities, tripId, bookingStatus }: PackagesDataTableProps) {
  const router = useRouter()

  // Helper to get activity booking status
  const getActivityStatus = React.useCallback((activityId: string): ActivityBookingStatusDto | null => {
    return bookingStatus?.activities?.[activityId] || null
  }, [bookingStatus])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

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
      console.warn('Missing activityId or tripId for navigation')
      return
    }

    router.push(`/trips/${tripId}/activities/${activityId}/edit?tab=booking`)
  }

  const columns: ColumnDef<ActivityResponseDto>[] = [
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
        const hasChildren = activities.some(a => a.parentActivityId === activity.id)
        const isExpanded = expandedRows.has(activity.id)

        return (
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={() => toggleRowExpansion(activity.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <div className="flex items-center gap-2">
              <ActivityIconBadge type={activity.activityType} size="md" />
              <span className="font-medium">{activity.name}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: ({ row }) => {
        const activity = row.original
        const activityStatus = getActivityStatus(activity.id)
        // Use paymentTotalCents from booking status (reads from activity_pricing.totalPriceCents)
        // Falls back to 0 if no booking status available
        const costCents = activityStatus?.paymentTotalCents ?? 0
        return formatCostCents(costCents, activity.currency)
      },
    },
    {
      accessorKey: 'location',
      header: 'Supplier',
      cell: ({ row }) => {
        const location = row.getValue('location') as string | null
        return <span className="text-gray-500">{location || '–'}</span>
      },
    },
    {
      accessorKey: 'confirmationNumber',
      header: 'Confirmation #',
      cell: ({ row }) => {
        const confirmationNumber = row.getValue('confirmationNumber') as string | null
        return <span className="text-gray-500">{confirmationNumber || '–'}</span>
      },
    },
    {
      id: 'payment',
      header: 'Payment',
      cell: ({ row }) => {
        const activity = row.original
        const activityStatus = getActivityStatus(activity.id)
        const badgeInfo = getPaymentStatusInfo(activityStatus)
        return <Badge variant={badgeInfo.variant as any}>{badgeInfo.label}</Badge>
      },
    },
    {
      id: 'commission',
      header: 'Commission',
      cell: ({ row }) => {
        const activity = row.original
        const activityStatus = getActivityStatus(activity.id)
        const badgeInfo = getCommissionStatusInfo(activityStatus)
        return <Badge variant={badgeInfo.variant as any}>{badgeInfo.label}</Badge>
      },
    },
    {
      id: 'actions',
      cell: () => {
        return (
          <button className="text-gray-400 hover:text-gray-600">
            ⋯
          </button>
        )
      },
    },
  ]

  // Filter out child activities for the main table
  const parentActivities = activities.filter(a => !a.parentActivityId)

  const table = useReactTable({
    data: parentActivities,
    columns,
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
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
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
              <>
                {table.getRowModel().rows.map((row) => {
                  const activity = row.original
                  const children = activities.filter(a => a.parentActivityId === activity.id)
                  const isExpanded = expandedRows.has(activity.id)

                  return (
                    <React.Fragment key={row.id}>
                      {/* Parent Row */}
                      <TableRow
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

                      {/* Child Rows */}
                      {isExpanded && children.map((child) => {
                        const childActivityStatus = getActivityStatus(child.id)
                        const childPaymentBadge = getPaymentStatusInfo(childActivityStatus)
                        const childCommissionBadge = getCommissionStatusInfo(childActivityStatus)

                        return (
                          <TableRow
                            key={child.id}
                            onClick={(e) => handleRowClick(child.id, e)}
                            className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                          >
                            <TableCell></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 pl-8">
                                <ActivityIconBadge type={child.activityType} size="sm" />
                                <span className="text-sm text-gray-700">{child.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              {formatCostCents(getActivityStatus(child.id)?.paymentTotalCents ?? 0, child.currency)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {child.location || '–'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {child.confirmationNumber || '–'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={childPaymentBadge.variant as any} className="text-xs">
                                {childPaymentBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={childCommissionBadge.variant as any} className="text-xs">
                                {childCommissionBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <ActivityIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500">No bookings yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Add your first booking to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
