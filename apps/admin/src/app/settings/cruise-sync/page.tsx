'use client'

import { SettingsTabsLayout } from '../_components/settings-tabs-layout'
import { SyncStatusCard } from './_components/sync-status-card'
import { SyncHistoryTable } from './_components/sync-history-table'
import { CoverageStatsCard } from './_components/coverage-stats-card'
import { MaintenanceCard } from './_components/maintenance-card'

export default function CruiseSyncPage() {
  return (
    <SettingsTabsLayout activeTab="cruise-sync">
      {/* Page-specific header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Cruise Data Sync</h3>
        <p className="text-sm text-muted-foreground">
          Manage and monitor Traveltek cruise data synchronization
        </p>
      </div>

      <div className="space-y-6">
        {/* Status and Controls */}
        <SyncStatusCard />

        {/* Coverage Statistics */}
        <CoverageStatsCard />

        {/* Sync History */}
        <SyncHistoryTable />

        {/* Maintenance Tools */}
        <MaintenanceCard />
      </div>
    </SettingsTabsLayout>
  )
}
