/**
 * Activity Documents Service
 *
 * Handles CRUD operations for activity documents.
 * Works with the activity_documents table.
 */

import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { DatabaseService } from '../db/database.service'
import { AuditEvent } from '../activity-logs/events/audit.event'
import { sanitizeForAudit, computeAuditDiff } from '../activity-logs/audit-sanitizer'

// Re-export document types from schema for single source of truth
export { VALID_DOCUMENT_TYPES, type DocumentType } from '@tailfire/database'

// DTO for document response
export interface ActivityDocumentDto {
  id: string
  activityId: string
  documentType: string | null
  fileUrl: string
  fileName: string
  fileSize: number | null
  uploadedAt: string
  uploadedBy: string | null
}

@Injectable()
export class ActivityDocumentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Resolve tripId from activityId by traversing: activity → day → itinerary → trip
   */
  private async resolveTripIdFromActivity(activityId: string): Promise<string | null> {
    const result = await this.db.client
      .select({ tripId: this.db.schema.itineraries.tripId })
      .from(this.db.schema.itineraryActivities)
      .innerJoin(
        this.db.schema.itineraryDays,
        eq(this.db.schema.itineraryActivities.itineraryDayId, this.db.schema.itineraryDays.id),
      )
      .innerJoin(
        this.db.schema.itineraries,
        eq(this.db.schema.itineraryDays.itineraryId, this.db.schema.itineraries.id),
      )
      .where(eq(this.db.schema.itineraryActivities.id, activityId))
      .limit(1)

    return result[0]?.tripId ?? null
  }

  /**
   * Get all documents for an activity
   */
  async findByActivityId(activityId: string): Promise<ActivityDocumentDto[]> {
    const documents = await this.db.client
      .select()
      .from(this.db.schema.activityDocuments)
      .where(eq(this.db.schema.activityDocuments.activityId, activityId))
      .orderBy(this.db.schema.activityDocuments.uploadedAt)

    return documents.map(this.formatDocument)
  }

  /**
   * Get a single document by ID
   */
  async findById(id: string): Promise<ActivityDocumentDto | null> {
    const [document] = await this.db.client
      .select()
      .from(this.db.schema.activityDocuments)
      .where(eq(this.db.schema.activityDocuments.id, id))
      .limit(1)

    if (!document) {
      return null
    }

    return this.formatDocument(document)
  }

  /**
   * Create a new document record
   */
  async create(
    data: {
      activityId: string
      documentType?: string | null
      fileUrl: string
      fileName: string
      fileSize?: number | null
      uploadedBy?: string | null
    },
    actorId?: string | null,
    tripId?: string | null,
  ): Promise<ActivityDocumentDto> {
    const [document] = await this.db.client
      .insert(this.db.schema.activityDocuments)
      .values({
        activityId: data.activityId,
        documentType: data.documentType || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize || null,
        uploadedBy: data.uploadedBy || null,
      })
      .returning()

    if (!document) {
      throw new Error('Failed to create activity document')
    }

    // Emit audit event
    const resolvedTripId = tripId ?? (await this.resolveTripIdFromActivity(data.activityId))
    if (resolvedTripId) {
      this.eventEmitter.emit(
        'audit.created',
        new AuditEvent(
          'activity_document',
          document.id,
          'created',
          resolvedTripId,
          actorId ?? null,
          `Document - ${document.fileName}`,
          {
            after: sanitizeForAudit('activity_document', document),
            parentId: data.activityId,
          },
        ),
      )
    }

    return this.formatDocument(document)
  }

  /**
   * Update a document record
   */
  async update(
    id: string,
    data: {
      documentType?: string | null
      fileName?: string
    },
    actorId?: string | null,
    tripId?: string | null,
  ): Promise<ActivityDocumentDto | null> {
    // Get before state
    const [before] = await this.db.client
      .select()
      .from(this.db.schema.activityDocuments)
      .where(eq(this.db.schema.activityDocuments.id, id))
      .limit(1)

    if (!before) {
      return null
    }

    const [document] = await this.db.client
      .update(this.db.schema.activityDocuments)
      .set({
        ...(data.documentType !== undefined && { documentType: data.documentType }),
        ...(data.fileName !== undefined && { fileName: data.fileName }),
      })
      .where(eq(this.db.schema.activityDocuments.id, id))
      .returning()

    if (!document) {
      return null
    }

    // Emit audit event
    const resolvedTripId = tripId ?? (await this.resolveTripIdFromActivity(document.activityId))
    if (resolvedTripId) {
      this.eventEmitter.emit(
        'audit.updated',
        new AuditEvent(
          'activity_document',
          document.id,
          'updated',
          resolvedTripId,
          actorId ?? null,
          `Document - ${document.fileName}`,
          computeAuditDiff('activity_document', before, document),
        ),
      )
    }

    return this.formatDocument(document)
  }

  /**
   * Delete a document record
   */
  async delete(
    id: string,
    actorId?: string | null,
    tripId?: string | null,
  ): Promise<ActivityDocumentDto | null> {
    const [document] = await this.db.client
      .delete(this.db.schema.activityDocuments)
      .where(eq(this.db.schema.activityDocuments.id, id))
      .returning()

    if (!document) {
      return null
    }

    // Emit audit event
    const resolvedTripId = tripId ?? (await this.resolveTripIdFromActivity(document.activityId))
    if (resolvedTripId) {
      this.eventEmitter.emit(
        'audit.deleted',
        new AuditEvent(
          'activity_document',
          document.id,
          'deleted',
          resolvedTripId,
          actorId ?? null,
          `Document - ${document.fileName}`,
          {
            before: sanitizeForAudit('activity_document', document),
            parentId: document.activityId,
          },
        ),
      )
    }

    return this.formatDocument(document)
  }

  /**
   * Delete all documents for an activity
   */
  async deleteByActivityId(activityId: string): Promise<number> {
    const result = await this.db.client
      .delete(this.db.schema.activityDocuments)
      .where(eq(this.db.schema.activityDocuments.activityId, activityId))
      .returning()

    return result.length
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatDocument(doc: any): ActivityDocumentDto {
    return {
      id: doc.id,
      activityId: doc.activityId,
      documentType: doc.documentType || null,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileSize: doc.fileSize || null,
      uploadedAt: doc.uploadedAt?.toISOString() || new Date().toISOString(),
      uploadedBy: doc.uploadedBy || null,
    }
  }
}
