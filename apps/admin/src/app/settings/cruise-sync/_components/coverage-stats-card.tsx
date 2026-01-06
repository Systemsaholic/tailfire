'use client'

import { Ship, Anchor, MapPin, Globe, Calendar, AlertTriangle, Map } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoverageStats, useStubsReport } from '@/hooks/use-cruise-sync'

interface StatBlockProps {
  icon: React.ReactNode
  label: string
  total: number
  completed: number
  completedLabel: string
  needsReview?: number
}

function StatBlock({ icon, label, total, completed, completedLabel, needsReview }: StatBlockProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {needsReview !== undefined && needsReview > 0 && (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700">
            <AlertTriangle className="h-3 w-3" />
            {needsReview} need review
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Progress value={percentage} className="h-2 flex-1" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completed.toLocaleString()}/{total.toLocaleString()} {completedLabel}
        </span>
      </div>
    </div>
  )
}

export function CoverageStatsCard() {
  const { data: coverage, isLoading: coverageLoading } = useCoverageStats()
  const { data: stubs, isLoading: stubsLoading } = useStubsReport()

  const isLoading = coverageLoading || stubsLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coverage Statistics</CardTitle>
        <CardDescription>
          Data completeness across ships, cruise lines, ports, and regions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !coverage ? (
          <div className="p-4 text-center text-muted-foreground">
            Unable to load coverage statistics
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ships */}
            <StatBlock
              icon={<Ship className="h-4 w-4 text-blue-500" />}
              label="Ships"
              total={coverage.ships.total}
              completed={coverage.ships.withImage}
              completedLabel="with images"
              needsReview={coverage.ships.needsReview}
            />

            {/* Ship Deck Plans */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-indigo-500" />
                <span className="font-medium">Ship Deck Plans</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={coverage.ships.total > 0 ? (coverage.ships.withDeckPlans / coverage.ships.total) * 100 : 0}
                  className="h-2 flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {coverage.ships.withDeckPlans.toLocaleString()}/{coverage.ships.total.toLocaleString()} with deck plans
                </span>
              </div>
            </div>

            {/* Cruise Lines */}
            <StatBlock
              icon={<Anchor className="h-4 w-4 text-teal-500" />}
              label="Cruise Lines"
              total={coverage.cruiseLines.total}
              completed={coverage.cruiseLines.withLogo}
              completedLabel="with logos"
              needsReview={coverage.cruiseLines.needsReview}
            />

            {/* Ports */}
            <StatBlock
              icon={<MapPin className="h-4 w-4 text-red-500" />}
              label="Ports"
              total={coverage.ports.total}
              completed={coverage.ports.withCoordinates}
              completedLabel="with coordinates"
              needsReview={coverage.ports.needsReview}
            />

            {/* Regions */}
            <StatBlock
              icon={<Globe className="h-4 w-4 text-green-500" />}
              label="Regions"
              total={coverage.regions.total}
              completed={coverage.regions.total - (coverage.regions.needsReview || 0)}
              completedLabel="configured"
              needsReview={coverage.regions.needsReview}
            />

            {/* Sailings Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Active Sailings</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {coverage.sailings.activeFuture.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {coverage.sailings.total.toLocaleString()} total
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Stubs Alert */}
            {stubs && stubs.totalPending > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      {stubs.totalPending} Items Need Review
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Auto-created stubs require manual review:
                      {stubs.cruiseLines > 0 && ` ${stubs.cruiseLines} cruise lines,`}
                      {stubs.ships > 0 && ` ${stubs.ships} ships,`}
                      {stubs.ports > 0 && ` ${stubs.ports} ports,`}
                      {stubs.regions > 0 && ` ${stubs.regions} regions`}
                    </p>
                    {stubs.oldestStubs.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-600">
                        Oldest: {stubs.oldestStubs.slice(0, 3).map(s => s.name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
