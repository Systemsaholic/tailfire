import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Tern Table Component
 * Implements Tern's dense table design with clean borders and minimal spacing
 */
const TernTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
))
TernTable.displayName = 'TernTable'

const TernTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('border-b border-tern-gray-200 bg-white', className)}
    {...props}
  />
))
TernTableHeader.displayName = 'TernTableHeader'

const TernTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TernTableBody.displayName = 'TernTableBody'

const TernTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-tern-gray-200 bg-tern-gray-50 font-medium',
      className
    )}
    {...props}
  />
))
TernTableFooter.displayName = 'TernTableFooter'

const TernTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-tern-gray-200 transition-colors hover:bg-tern-gray-50 data-[state=selected]:bg-tern-teal-50',
      className
    )}
    {...props}
  />
))
TernTableRow.displayName = 'TernTableRow'

const TernTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-3 text-left align-middle font-medium text-tern-gray-700 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TernTableHead.displayName = 'TernTableHead'

const TernTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-3 align-middle text-tern-gray-900 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TernTableCell.displayName = 'TernTableCell'

const TernTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-tern-gray-500', className)}
    {...props}
  />
))
TernTableCaption.displayName = 'TernTableCaption'

export {
  TernTable,
  TernTableHeader,
  TernTableBody,
  TernTableFooter,
  TernTableHead,
  TernTableRow,
  TernTableCell,
  TernTableCaption,
}
