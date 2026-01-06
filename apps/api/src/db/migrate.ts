import { runMigrations } from '@tailfire/database'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  try {
    await runMigrations(databaseUrl)
    console.info('✅ All migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
