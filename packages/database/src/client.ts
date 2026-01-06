import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Creates a Drizzle database client with the full schema
 *
 * @param connectionString - PostgreSQL connection string (direct TCP)
 * @param options - Optional postgres driver options
 * @returns Drizzle database client instance
 *
 * @example
 * ```typescript
 * import { createDbClient } from '@tailfire/database'
 *
 * const db = createDbClient(process.env.DATABASE_URL!)
 * const trips = await db.query.trips.findMany()
 * ```
 */
export function createDbClient(
  connectionString: string,
  options: postgres.Options<{}> = {}
) {
  // Detect if using Supabase pooler (pooler.supabase.com or port 6543)
  // Pooled connections require prepare: false for transactions to work correctly
  const isPooledConnection = connectionString.includes('pooler.supabase.com') ||
    connectionString.includes(':6543/')

  const sql = postgres(connectionString, {
    max: 10,
    prepare: !isPooledConnection, // Disable prepared statements for pooled connections
    ...options,
  })

  return drizzle(sql, { schema })
}

export type Database = ReturnType<typeof createDbClient>
