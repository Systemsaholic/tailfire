/**
 * Dashboard Service
 *
 * Aggregates statistics for the dashboard overview
 */

import { Injectable } from '@nestjs/common'
import { eq, and, sql } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'

export interface DashboardStats {
  totalTrips: number
  activeTrips: number
  totalContacts: number
  totalRevenue: number
}

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get dashboard statistics for an agency
   */
  async getStats(agencyId: string): Promise<DashboardStats> {
    const [tripsResult, contactsResult, revenueResult] = await Promise.all([
      // Get trip counts
      this.db.client
        .select({
          totalTrips: sql<number>`count(*)::int`,
          activeTrips: sql<number>`count(*) filter (where ${this.db.schema.trips.status} in ('booked', 'in_progress'))::int`,
        })
        .from(this.db.schema.trips)
        .where(eq(this.db.schema.trips.agencyId, agencyId)),

      // Get contact count
      this.db.client
        .select({
          totalContacts: sql<number>`count(*)::int`,
        })
        .from(this.db.schema.contacts)
        .where(eq(this.db.schema.contacts.agencyId, agencyId)),

      // Get total revenue from payment transactions (payments only, not refunds)
      this.db.client
        .select({
          totalRevenue: sql<number>`coalesce(sum(${this.db.schema.paymentTransactions.amountCents}), 0)::int`,
        })
        .from(this.db.schema.paymentTransactions)
        .where(
          and(
            eq(this.db.schema.paymentTransactions.agencyId, agencyId),
            eq(this.db.schema.paymentTransactions.transactionType, 'payment'),
          ),
        ),
    ])

    return {
      totalTrips: tripsResult[0]?.totalTrips || 0,
      activeTrips: tripsResult[0]?.activeTrips || 0,
      totalContacts: contactsResult[0]?.totalContacts || 0,
      // Convert cents to dollars
      totalRevenue: (revenueResult[0]?.totalRevenue || 0) / 100,
    }
  }
}
