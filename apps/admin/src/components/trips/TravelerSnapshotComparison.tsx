/**
 * Traveler Snapshot Comparison Component
 *
 * Displays a visual comparison between the traveler's information at the time
 * the trip was booked (snapshot) vs their current information.
 *
 * Highlights changes in TERN violet to draw attention to updated data that
 * may need to be verified before travel.
 */

import { AlertCircle, Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  type SnapshotDiff,
  type FieldChange,
  type ValidationResult,
  type ValidationIssue,
  FIELD_CATEGORIES,
  formatFieldValue,
  getChangeSummary,
  categoryHasChanges,
} from '@/lib/snapshot-utils'

type TravelerSnapshotComparisonProps = {
  diff: SnapshotDiff
  snapshotDate: string
  validation?: ValidationResult
  className?: string
  onConfirm?: () => void
  isConfirming?: boolean
  travelerName?: string
}

/**
 * Display a single field change with old → new values
 */
function FieldChangeRow({ change }: { change: FieldChange }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 text-sm">
      <div className="text-muted-foreground font-medium">{change.label}</div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground line-through">
          {formatFieldValue(change.oldValue)}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium text-violet-700 dark:text-violet-400">
          {formatFieldValue(change.newValue)}
        </span>
      </div>
    </div>
  )
}

/**
 * Display a single validation issue
 */
function ValidationIssueRow({ issue }: { issue: ValidationIssue }) {
  const Icon = issue.type === 'error' ? XCircle : AlertTriangle
  const colorClass = issue.type === 'error'
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-600 dark:text-amber-400'

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorClass}`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{issue.label}</div>
        <div className={`text-sm ${colorClass}`}>{issue.message}</div>
      </div>
    </div>
  )
}

/**
 * Display validation issues section
 */
function ValidationIssuesSection({ validation }: { validation: ValidationResult }) {
  if (!validation.hasIssues) {
    return null
  }

  return (
    <div className="space-y-4">
      {validation.errors.length > 0 && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
              Required Information Missing
            </h4>
            <Badge variant="outline" className="bg-red-100 text-red-900 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700">
              {validation.errors.length} {validation.errors.length === 1 ? 'error' : 'errors'}
            </Badge>
          </div>
          <div className="space-y-1">
            {validation.errors.map((issue) => (
              <ValidationIssueRow key={issue.field} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Action Required
            </h4>
            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700">
              {validation.warnings.length} {validation.warnings.length === 1 ? 'warning' : 'warnings'}
            </Badge>
          </div>
          <div className="space-y-1">
            {validation.warnings.map((issue) => (
              <ValidationIssueRow key={issue.field} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Display changes grouped by category
 */
function CategorySection({
  category,
  diff,
}: {
  category: keyof typeof FIELD_CATEGORIES
  diff: SnapshotDiff
}) {
  const changes = diff.changesByCategory[category]

  if (changes.length === 0) {
    return null
  }

  const categoryInfo = FIELD_CATEGORIES[category]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-foreground">{categoryInfo.label}</h4>
        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800">
          {changes.length} {changes.length === 1 ? 'change' : 'changes'}
        </Badge>
      </div>
      <div className="space-y-1">
        {changes.map((change) => (
          <FieldChangeRow key={change.field} change={change} />
        ))}
      </div>
    </div>
  )
}

/**
 * Main component: Traveler Snapshot Comparison
 */
export function TravelerSnapshotComparison({
  diff,
  snapshotDate,
  validation,
  className,
  onConfirm,
  isConfirming = false,
  travelerName,
}: TravelerSnapshotComparisonProps) {
  const formattedSnapshotDate = new Date(snapshotDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const hasAnyIssues = diff.hasChanges || (validation && validation.hasIssues)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {validation && validation.errors.length > 0 ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Required Information Missing
                  {travelerName && <span className="font-normal text-muted-foreground">- {travelerName}</span>}
                </>
              ) : validation && validation.warnings.length > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Action Required
                  {travelerName && <span className="font-normal text-muted-foreground">- {travelerName}</span>}
                </>
              ) : diff.hasChanges ? (
                <>
                  <AlertCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Traveler Information Updated
                  {travelerName && <span className="font-normal text-muted-foreground">- {travelerName}</span>}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  No Issues Detected
                  {travelerName && <span className="font-normal text-muted-foreground">- {travelerName}</span>}
                </>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Snapshot taken: {formattedSnapshotDate}</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {diff.hasChanges && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="bg-violet-100 text-violet-900 dark:bg-violet-900 dark:text-violet-100"
                      >
                        {diff.totalChanges} {diff.totalChanges === 1 ? 'Change' : 'Changes'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getChangeSummary(diff)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {onConfirm && (
                  <Button
                    size="sm"
                    onClick={onConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm Changes'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {hasAnyIssues && (
        <CardContent className="space-y-6">
          {/* Validation Issues */}
          {validation && validation.hasIssues && (
            <ValidationIssuesSection validation={validation} />
          )}

          {/* Snapshot Changes */}
          {diff.hasChanges && (
            <>
              <div className="rounded-md bg-violet-50 dark:bg-violet-950 p-4 border border-violet-200 dark:border-violet-800">
                <p className="text-sm text-violet-900 dark:text-violet-100">
                  <strong>Note:</strong> The following information has been updated since this trip was created.
                  Please verify these changes with the traveler before finalizing travel documents.
                </p>
              </div>

              <div className="space-y-6">
                {(Object.keys(FIELD_CATEGORIES) as Array<keyof typeof FIELD_CATEGORIES>).map((category, index) => (
                  <div key={category}>
                    {index > 0 && categoryHasChanges(diff, category) && <Separator />}
                    <CategorySection category={category} diff={diff} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}

      {!hasAnyIssues && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All traveler information is complete and up to date.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
