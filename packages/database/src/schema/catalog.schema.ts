/**
 * Catalog Schema Definition
 *
 * Defines the 'catalog' schema for Traveltek/cruise repository tables.
 * This schema is used in Prod for local tables and in Dev for FDW foreign tables.
 */

import { pgSchema } from 'drizzle-orm/pg-core'

export const catalogSchema = pgSchema('catalog')
