#!/usr/bin/env tsx
/**
 * Migration Validation Script
 *
 * Validates migration file naming conventions and detects duplicates.
 * Does NOT check against Supabase migrations table (that's the source of truth for applied state).
 * Run as part of CI or before deployments.
 */

import * as fs from 'fs'
import * as path from 'path'

const MIGRATIONS_DIR = path.join(__dirname, '../src/migrations')

// New migrations must use timestamp format
const TIMESTAMP_PATTERN = /^\d{14}_[a-z][a-z0-9_]*\.sql$/
// Legacy migrations (grandfathered) use sequential format
const LEGACY_PATTERN = /^\d{4}_[a-z][a-z0-9_]*\.sql$/

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validateMigrations(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Get local migration files (exclude _archive directory and subdirectories)
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  const files = entries
    .filter(e => e.isFile() && e.name.endsWith('.sql') && !e.name.startsWith('_'))
    .map(e => e.name)
    .sort()

  for (const file of files) {
    const isTimestamp = TIMESTAMP_PATTERN.test(file)
    const isLegacy = LEGACY_PATTERN.test(file)

    if (!isTimestamp && !isLegacy) {
      errors.push(`Invalid naming: ${file} - must match YYYYMMDDHHMMSS_name.sql or NNNN_name.sql`)
    }

    // Check for duplicate prefixes (e.g., two files starting with "0015_")
    const prefix = file.match(/^(\d+)/)?.[1]
    if (prefix) {
      const duplicates = files.filter(f => f.startsWith(prefix + '_') && f !== file)
      if (duplicates.length > 0) {
        errors.push(`Duplicate prefix ${prefix}: ${file} conflicts with ${duplicates.join(', ')}`)
      }
    }
  }

  // Verify chronological ordering for timestamp migrations
  const timestamps = files
    .filter(f => TIMESTAMP_PATTERN.test(f))
    .map(f => ({ file: f, ts: f.substring(0, 14) }))
    .sort((a, b) => a.ts.localeCompare(b.ts))

  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i].ts <= timestamps[i-1].ts) {
      warnings.push(`Out of order: ${timestamps[i].file} should come after ${timestamps[i-1].file}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Main
const result = validateMigrations()
console.log('Migration Validation Results:')
console.log('============================')

if (result.errors.length > 0) {
  console.log('\nERRORS:')
  result.errors.forEach(e => console.log(`  ${e}`))
}

if (result.warnings.length > 0) {
  console.log('\nWARNINGS:')
  result.warnings.forEach(w => console.log(`  ${w}`))
}

if (result.valid) {
  console.log('\nAll migrations valid')
  process.exit(0)
} else {
  console.log('\nValidation failed')
  process.exit(1)
}
