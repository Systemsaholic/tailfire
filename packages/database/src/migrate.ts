import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { join } from 'path'

/**
 * Runs pending database migrations
 *
 * ⚠️ IMPORTANT: This should ONLY be called from apps/api during deployment.
 * Do NOT run migrations from edge functions, frontend, or other environments.
 *
 * @param connectionString - PostgreSQL connection string (requires service role key)
 *
 * @example
 * ```typescript
 * // apps/api/src/db/migrate-on-startup.ts
 * import { runMigrations } from '@tailfire/database'
 *
 * await runMigrations(process.env.DATABASE_URL!)
 * ```
 */
export async function runMigrations(connectionString: string) {
  console.log('🔄 Running database migrations...')

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql)

  try {
    // Point to source migrations folder (SQL files are not copied to dist/)
    // __dirname will be packages/database/dist/, so go up and into src/migrations
    const migrationsFolder = join(__dirname, '..', 'src', 'migrations')
    await migrate(db, { migrationsFolder })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await sql.end()
  }
}
