import { resetDatabase, seedDatabase } from '@tailfire/database'
import * as dotenv from 'dotenv'
import * as readline from 'readline'
import { URL } from 'url'

// Load environment variables
dotenv.config()

// Whitelist of safe database hosts
const SAFE_HOSTS = [
  'localhost',
  '127.0.0.1',
  'db.127.0.0.1.nip.io',
  'postgres', // Docker container name
]

// Supabase local development port
const SAFE_SUPABASE_PORT = 54322

interface ParsedConnection {
  hostname: string
  port: number | null
  database: string | null
  isSafe: boolean
  warning?: string
}

/**
 * Parse PostgreSQL connection string
 */
function parseConnectionString(connectionString: string): ParsedConnection {
  try {
    // Handle postgres:// or postgresql:// URLs
    const url = new URL(connectionString)
    const hostname = url.hostname
    const port = url.port ? parseInt(url.port, 10) : null
    const database = url.pathname.slice(1) // Remove leading /

    // Check if this is a safe host
    let isSafe = false
    let warning: string | undefined

    // Check whitelist
    if (SAFE_HOSTS.includes(hostname)) {
      isSafe = true
    }
    // Check Supabase local port
    else if (
      hostname.includes('supabase.co') &&
      port === SAFE_SUPABASE_PORT
    ) {
      isSafe = true
    }
    // Production Supabase (pooler.supabase.com or db.*.supabase.co)
    else if (
      hostname.includes('supabase.com') ||
      hostname.includes('supabase.co')
    ) {
      warning = 'This appears to be a Supabase cloud database'
    }
    // Unknown host
    else {
      warning = 'Unknown database host - please verify this is safe'
    }

    return { hostname, port, database, isSafe, warning }
  } catch (error) {
    throw new Error(`Failed to parse DATABASE_URL: ${error}`)
  }
}

/**
 * Prompt user for confirmation (cross-platform readline)
 */
async function promptConfirmation(message: string): Promise<boolean> {
  // Check if we're in a TTY (interactive terminal)
  if (!process.stdin.isTTY) {
    console.error(
      '❌ Not running in interactive terminal. Use --force flag for automation.'
    )
    return false
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Display dry-run preview without connecting to database
 */
function displayDryRunPreview(
  parsed: ParsedConnection,
  shouldSeed: boolean
): void {
  console.info('🔍 DRY RUN MODE - Preview Only (No Changes Will Be Made)')
  console.info('')
  console.info('📊 Connection Details:')
  console.info(`   Host:     ${parsed.hostname}`)
  console.info(`   Port:     ${parsed.port || 'default (5432)'}`)
  console.info(`   Database: ${parsed.database || 'unknown'}`)
  console.info(`   Safe:     ${parsed.isSafe ? '✅ Yes' : '⚠️  No'}`)
  if (parsed.warning) {
    console.info(`   Warning:  ${parsed.warning}`)
  }
  console.info('')
  console.info('📝 Operations That Would Be Performed:')
  console.info('   1. Drop all tables in public schema')
  console.info('   2. Drop drizzle metadata schema')
  console.info('   3. Run migrations:')
  console.info('      - 0000_aberrant_mikhail_rasputin')
  console.info('      - 0001_polite_piledriver')
  console.info('      - 0002_add_bidirectional_relationship_constraint')
  console.info('      - 0003_make_agency_id_nullable')
  console.info('      - 0004_identity_and_inclusive_fields')
  console.info('      - 0005_lifecycle_and_status_system')
  console.info('      - 0006_marketing_compliance')
  console.info('      - 0007_travel_credentials_and_preferences')

  if (shouldSeed) {
    console.info('   4. Seed database with test data:')
    console.info('      - 31 contacts (22 clients, 9 leads)')
    console.info('      - 8 relationships')
    console.info('      - 5 groups')
    console.info('      - 11 group members')
  }

  console.info('')
  console.info('💡 To execute these operations, run without --dry-run flag')
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  // Parse command-line flags
  const shouldSeed = process.argv.includes('--seed')
  const isDryRun = process.argv.includes('--dry-run')
  const isForce = process.argv.includes('--force')

  // Parse connection details
  const parsed = parseConnectionString(databaseUrl)

  // Safety check: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SAFETY: Cannot reset database in production!')
    console.error('   Set NODE_ENV=development to proceed')
    process.exit(1)
  }

  // Dry-run mode: Display preview and exit
  if (isDryRun) {
    displayDryRunPreview(parsed, shouldSeed)
    process.exit(0)
  }

  // Display warning
  console.info('⚠️  WARNING: This will DELETE ALL DATA in the database!')
  console.info('')
  console.info('📊 Connection Details:')
  console.info(`   Host:     ${parsed.hostname}`)
  console.info(`   Port:     ${parsed.port || 'default (5432)'}`)
  console.info(`   Database: ${parsed.database || 'unknown'}`)
  console.info('')

  if (parsed.warning) {
    console.info(`⚠️  ${parsed.warning}`)
    console.info('')
  }

  if (!shouldSeed) {
    console.info('💡 Tip: Run with --seed flag to also populate test data')
    console.info('   Example: pnpm db:reset --seed')
    console.info('')
  }

  // --force flag: Auto-set environment variables and skip confirmation
  if (isForce) {
    process.env.ALLOW_DATABASE_RESET = 'true'
    process.env.CI_ALLOW_DB_RESET = 'true'
    console.info('⚡ Force mode enabled - skipping confirmation')
    console.info('')
  }
  // Interactive confirmation
  else {
    // Check environment variable permission
    const allowReset =
      process.env.ALLOW_DATABASE_RESET === 'true' ||
      process.env.CI_ALLOW_DB_RESET === 'true'

    if (!allowReset) {
      console.error('❌ SAFETY: ALLOW_DATABASE_RESET is not set')
      console.error(
        '   Set ALLOW_DATABASE_RESET=true in .env to enable database reset'
      )
      console.error('   Or use --force flag: pnpm db:reset --force')
      process.exit(1)
    }

    // Extra confirmation for unknown hosts
    if (!parsed.isSafe) {
      console.info('🚨 EXTRA CONFIRMATION REQUIRED')
      console.info(
        '   This database host is not in the known safe hosts list:'
      )
      console.info(`   ${SAFE_HOSTS.join(', ')}`)
      console.info('')

      const hostConfirmed = await promptConfirmation(
        'Are you absolutely sure this is a safe database to reset? (Type "yes" to confirm): '
      )

      if (!hostConfirmed) {
        console.info('❌ Reset cancelled')
        process.exit(1)
      }

      console.info('')
    }

    // Standard confirmation
    const confirmed = await promptConfirmation(
      'Type "yes" to confirm database reset: '
    )

    if (!confirmed) {
      console.info('❌ Reset cancelled')
      process.exit(1)
    }

    console.info('')
  }

  try {
    // Reset database (drop all tables + run migrations)
    await resetDatabase(databaseUrl)

    if (shouldSeed) {
      console.info('')
      await seedDatabase(databaseUrl)
    }

    console.info('')
    console.info('✅ Database reset complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

main()
