/**
 * Trip Media Service
 *
 * Handles CRUD operations for trip-level media (images, videos, documents).
 * Includes cover photo enforcement (single cover per trip) with atomic updates
 * to trips.coverPhotoUrl.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and, asc, ne } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import { MediaType } from '@tailfire/database'
import type {
  TripMediaResponseDto,
  CreateTripMediaDto,
  UpdateTripMediaDto,
  AddExternalTripMediaRequest,
  MediaAttribution,
  UnsplashAttribution,
} from '@tailfire/shared-types'

// Valid media types
export const VALID_MEDIA_TYPES: MediaType[] = ['image', 'video', 'document']

// Max file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

@Injectable()
export class TripMediaService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all media for a trip, ordered by orderIndex
   */
  async findByTripId(tripId: string): Promise<TripMediaResponseDto[]> {
    // Validate trip exists
    await this.validateTripExists(tripId)

    const media = await this.db.client
      .select()
      .from(this.db.schema.tripMedia)
      .where(eq(this.db.schema.tripMedia.tripId, tripId))
      .orderBy(asc(this.db.schema.tripMedia.orderIndex))

    return media.map(this.formatMedia)
  }

  /**
   * Get a single media item by ID
   */
  async findById(id: string, tripId?: string): Promise<TripMediaResponseDto> {
    const conditions = [eq(this.db.schema.tripMedia.id, id)]
    if (tripId) {
      conditions.push(eq(this.db.schema.tripMedia.tripId, tripId))
    }

    const [media] = await this.db.client
      .select()
      .from(this.db.schema.tripMedia)
      .where(and(...conditions))
      .limit(1)

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`)
    }

    return this.formatMedia(media)
  }

  /**
   * Get the cover photo for a trip
   */
  async getCoverPhoto(tripId: string): Promise<TripMediaResponseDto | null> {
    const [media] = await this.db.client
      .select()
      .from(this.db.schema.tripMedia)
      .where(
        and(
          eq(this.db.schema.tripMedia.tripId, tripId),
          eq(this.db.schema.tripMedia.isCoverPhoto, true)
        )
      )
      .limit(1)

    if (!media) {
      return null
    }

    return this.formatMedia(media)
  }

  /**
   * Create a new media record
   */
  async create(
    tripId: string,
    dto: CreateTripMediaDto,
  ): Promise<TripMediaResponseDto> {
    // Validate trip exists
    await this.validateTripExists(tripId)

    // Validate media type
    if (!VALID_MEDIA_TYPES.includes(dto.mediaType)) {
      throw new BadRequestException(`Invalid media type: ${dto.mediaType}`)
    }

    // Validate file size if provided
    if (dto.fileSize && dto.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Get the next order index for this trip
    const nextOrderIndex = await this.getNextOrderIndex(tripId)

    // If this should be the cover photo, clear any existing cover
    if (dto.isCoverPhoto) {
      await this.clearExistingCoverPhoto(tripId)
    }

    const [media] = await this.db.client
      .insert(this.db.schema.tripMedia)
      .values({
        tripId,
        mediaType: dto.mediaType,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize || null,
        caption: dto.caption || null,
        isCoverPhoto: dto.isCoverPhoto || false,
        orderIndex: dto.orderIndex ?? nextOrderIndex,
      })
      .returning()

    // If this is the cover photo, update trips.coverPhotoUrl
    if (dto.isCoverPhoto) {
      await this.updateTripCoverPhotoUrl(tripId, dto.fileUrl)
    }

    return this.formatMedia(media)
  }

  /**
   * Add external media (e.g., Unsplash) to a trip
   */
  async addExternal(
    tripId: string,
    dto: AddExternalTripMediaRequest,
    unsplashPhotoData: {
      urls: { regular: string; small: string }
      user: { name: string; username: string; links: { html: string } }
      links: { html: string }
      description?: string | null
    },
  ): Promise<TripMediaResponseDto> {
    // Validate trip exists
    await this.validateTripExists(tripId)

    // Get the next order index
    const nextOrderIndex = await this.getNextOrderIndex(tripId)

    // If this should be the cover photo, clear any existing cover
    if (dto.isCoverPhoto) {
      await this.clearExistingCoverPhoto(tripId)
    }

    // Build attribution data
    const attribution: UnsplashAttribution = {
      source: 'unsplash',
      photoId: dto.unsplashPhotoId,
      photographerName: unsplashPhotoData.user.name,
      photographerUsername: unsplashPhotoData.user.username,
      photographerUrl: unsplashPhotoData.user.links.html,
      sourceUrl: unsplashPhotoData.links.html,
      downloadLocation: dto.downloadLocation,
    }

    const [media] = await this.db.client
      .insert(this.db.schema.tripMedia)
      .values({
        tripId,
        mediaType: 'image',
        fileUrl: unsplashPhotoData.urls.regular,
        fileName: `unsplash-${dto.unsplashPhotoId}.jpg`,
        caption: dto.caption || unsplashPhotoData.description || null,
        isCoverPhoto: dto.isCoverPhoto || false,
        orderIndex: nextOrderIndex,
        attribution,
      })
      .returning()

    // If this is the cover photo, update trips.coverPhotoUrl
    if (dto.isCoverPhoto) {
      await this.updateTripCoverPhotoUrl(tripId, unsplashPhotoData.urls.regular)
    }

    return this.formatMedia(media)
  }

  /**
   * Update a media record (caption, orderIndex)
   */
  async update(
    id: string,
    tripId: string,
    dto: UpdateTripMediaDto,
  ): Promise<TripMediaResponseDto> {
    // Validate media exists and belongs to trip
    await this.findById(id, tripId)

    const updateData: Record<string, any> = {}
    if (dto.caption !== undefined) updateData.caption = dto.caption
    if (dto.orderIndex !== undefined) updateData.orderIndex = dto.orderIndex

    if (Object.keys(updateData).length === 0) {
      return this.findById(id, tripId)
    }

    const [media] = await this.db.client
      .update(this.db.schema.tripMedia)
      .set(updateData)
      .where(eq(this.db.schema.tripMedia.id, id))
      .returning()

    return this.formatMedia(media)
  }

  /**
   * Set a media item as the trip's cover photo
   * Clears any existing cover photo and updates trips.coverPhotoUrl atomically
   */
  async setCoverPhoto(id: string, tripId: string): Promise<TripMediaResponseDto> {
    // Validate media exists and belongs to trip
    const media = await this.findById(id, tripId)

    // Only images can be cover photos
    if (media.mediaType !== 'image') {
      throw new BadRequestException('Only images can be set as cover photo')
    }

    // Clear existing cover photo for this trip
    await this.clearExistingCoverPhoto(tripId, id)

    // Set this media as cover photo
    const [updated] = await this.db.client
      .update(this.db.schema.tripMedia)
      .set({ isCoverPhoto: true })
      .where(eq(this.db.schema.tripMedia.id, id))
      .returning()

    // Update trips.coverPhotoUrl
    await this.updateTripCoverPhotoUrl(tripId, media.fileUrl)

    return this.formatMedia(updated)
  }

  /**
   * Remove cover photo designation from a media item
   */
  async removeCoverPhoto(id: string, tripId: string): Promise<TripMediaResponseDto> {
    // Validate media exists and belongs to trip
    await this.findById(id, tripId)

    const [updated] = await this.db.client
      .update(this.db.schema.tripMedia)
      .set({ isCoverPhoto: false })
      .where(eq(this.db.schema.tripMedia.id, id))
      .returning()

    // Clear trips.coverPhotoUrl
    await this.updateTripCoverPhotoUrl(tripId, null)

    return this.formatMedia(updated)
  }

  /**
   * Delete a media record
   * If it's the cover photo, also clears trips.coverPhotoUrl
   */
  async delete(id: string, tripId: string): Promise<TripMediaResponseDto> {
    // Validate media exists and belongs to trip
    const existing = await this.findById(id, tripId)

    const [media] = await this.db.client
      .delete(this.db.schema.tripMedia)
      .where(eq(this.db.schema.tripMedia.id, id))
      .returning()

    // If deleted media was the cover photo, clear trips.coverPhotoUrl
    if (existing.isCoverPhoto) {
      await this.updateTripCoverPhotoUrl(tripId, null)
    }

    return this.formatMedia(media)
  }

  /**
   * Delete all media for a trip
   */
  async deleteByTripId(tripId: string): Promise<number> {
    const result = await this.db.client
      .delete(this.db.schema.tripMedia)
      .where(eq(this.db.schema.tripMedia.tripId, tripId))
      .returning()

    // Clear trips.coverPhotoUrl
    await this.updateTripCoverPhotoUrl(tripId, null)

    return result.length
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Validate that a trip exists
   */
  private async validateTripExists(tripId: string): Promise<void> {
    const [trip] = await this.db.client
      .select({ id: this.db.schema.trips.id })
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`)
    }
  }

  /**
   * Get the next order index for a trip's media
   */
  private async getNextOrderIndex(tripId: string): Promise<number> {
    const existingMedia = await this.db.client
      .select({ orderIndex: this.db.schema.tripMedia.orderIndex })
      .from(this.db.schema.tripMedia)
      .where(eq(this.db.schema.tripMedia.tripId, tripId))
      .orderBy(asc(this.db.schema.tripMedia.orderIndex))

    if (existingMedia.length === 0) {
      return 0
    }

    return Math.max(...existingMedia.map(m => m.orderIndex)) + 1
  }

  /**
   * Clear any existing cover photo for a trip
   * Optionally excludes a specific media ID (when setting a new cover)
   */
  private async clearExistingCoverPhoto(tripId: string, excludeId?: string): Promise<void> {
    const conditions = [
      eq(this.db.schema.tripMedia.tripId, tripId),
      eq(this.db.schema.tripMedia.isCoverPhoto, true),
    ]

    if (excludeId) {
      conditions.push(ne(this.db.schema.tripMedia.id, excludeId))
    }

    await this.db.client
      .update(this.db.schema.tripMedia)
      .set({ isCoverPhoto: false })
      .where(and(...conditions))
  }

  /**
   * Update the trips.coverPhotoUrl field
   */
  private async updateTripCoverPhotoUrl(tripId: string, url: string | null): Promise<void> {
    await this.db.client
      .update(this.db.schema.trips)
      .set({ coverPhotoUrl: url, updatedAt: new Date() })
      .where(eq(this.db.schema.trips.id, tripId))
  }

  /**
   * Format database record to DTO
   */
  private formatMedia(media: any): TripMediaResponseDto {
    return {
      id: media.id,
      tripId: media.tripId,
      mediaType: media.mediaType,
      fileUrl: media.fileUrl,
      fileName: media.fileName,
      fileSize: media.fileSize || null,
      caption: media.caption || null,
      isCoverPhoto: media.isCoverPhoto,
      orderIndex: media.orderIndex,
      uploadedAt: media.uploadedAt?.toISOString() || new Date().toISOString(),
      uploadedBy: media.uploadedBy || null,
      attribution: media.attribution as MediaAttribution | null,
    }
  }
}
