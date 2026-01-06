/**
 * Trip Media Controller
 *
 * API endpoints for managing trip-level media (images, videos, documents).
 * Includes cover photo management with single-cover enforcement.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { TripMediaService, MAX_FILE_SIZE } from './trip-media.service'
import { StorageService } from './storage.service'
import { UnsplashService } from '../unsplash/unsplash.service'
import { MediaType } from '@tailfire/database'
import type {
  CreateTripMediaDto,
  UpdateTripMediaDto,
  AddExternalTripMediaRequest,
} from '@tailfire/shared-types'
import { ApiTags } from '@nestjs/swagger'

// Allowed MIME types for media
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  // Videos (future support)
  'video/mp4',
  'video/webm',
]

// Map MIME type to media type
function getMimeMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

@ApiTags('Trip Media')
@Controller('trips/:tripId/media')
export class TripMediaController {
  private readonly logger = new Logger(TripMediaController.name)

  constructor(
    private readonly mediaService: TripMediaService,
    private readonly storageService: StorageService,
    private readonly unsplashService: UnsplashService
  ) {}

  /**
   * List all media for a trip
   * GET /trips/:tripId/media
   */
  @Get()
  async list(@Param('tripId') tripId: string) {
    const media = await this.mediaService.findByTripId(tripId)
    return { media }
  }

  /**
   * Get the cover photo for a trip
   * GET /trips/:tripId/media/cover
   */
  @Get('cover')
  async getCover(@Param('tripId') tripId: string) {
    const cover = await this.mediaService.getCoverPhoto(tripId)
    return { cover }
  }

  /**
   * Get a single media item
   * GET /trips/:tripId/media/:mediaId
   */
  @Get(':mediaId')
  async get(
    @Param('tripId') tripId: string,
    @Param('mediaId') mediaId: string
  ) {
    return this.mediaService.findById(mediaId, tripId)
  }

  /**
   * Upload a new media file
   * POST /trips/:tripId/media
   * Content-Type: multipart/form-data
   * Body: file (required), caption (optional), isCoverPhoto (optional)
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
    @Body('isCoverPhoto') isCoverPhotoStr?: string
  ) {
    const isCoverPhoto = isCoverPhotoStr === 'true'

    // Validate file presence
    if (!file) {
      throw new BadRequestException('No file provided')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, GIF, WebP, AVIF, MP4, WebM`
      )
    }

    // Check if media storage is available
    if (!this.storageService.isMediaAvailable()) {
      throw new BadRequestException(
        'Media storage service not configured. Please ensure R2_MEDIA_BUCKET and R2_MEDIA_PUBLIC_URL environment variables are set.'
      )
    }

    // Determine media type from MIME type
    const mediaType = getMimeMediaType(file.mimetype)

    // Only images can be cover photos
    if (isCoverPhoto && mediaType !== 'image') {
      throw new BadRequestException('Only images can be set as cover photo')
    }

    // Upload to media storage
    const folder = `trips/${tripId}/media`
    const { url: fileUrl } = await this.storageService.uploadMediaFile(
      file.buffer,
      folder,
      file.originalname,
      file.mimetype
    )

    // Create database record
    const dto: CreateTripMediaDto = {
      mediaType,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      caption: caption || undefined,
      isCoverPhoto,
    }

    const media = await this.mediaService.create(tripId, dto)
    return media
  }

  /**
   * Add external media from Unsplash
   * POST /trips/:tripId/media/external
   * Body: { unsplashPhotoId, downloadLocation, caption?, isCoverPhoto? }
   */
  @Post('external')
  async addExternalMedia(
    @Param('tripId') tripId: string,
    @Body() body: AddExternalTripMediaRequest
  ) {
    // Validate required fields
    if (!body.unsplashPhotoId) {
      throw new BadRequestException('unsplashPhotoId is required')
    }
    if (!body.downloadLocation) {
      throw new BadRequestException('downloadLocation is required')
    }

    // Check if Unsplash is configured
    if (!this.unsplashService.isAvailable()) {
      throw new BadRequestException(
        'Unsplash API not configured. Please set UNSPLASH_ACCESS_KEY in environment.'
      )
    }

    // Check if media storage is available
    if (!this.storageService.isMediaAvailable()) {
      throw new BadRequestException(
        'Media storage service not configured. Please ensure R2_MEDIA_BUCKET and R2_MEDIA_PUBLIC_URL environment variables are set.'
      )
    }

    try {
      // 1. Fetch photo details from Unsplash (validates it's a real photo)
      this.logger.debug(`Fetching Unsplash photo: ${body.unsplashPhotoId}`)
      const photo = await this.unsplashService.getPhoto(body.unsplashPhotoId)

      // 2. Download the image server-side
      this.logger.debug(`Downloading image from Unsplash`)
      const { buffer, contentType } = await this.unsplashService.downloadImage(
        photo.urls.regular
      )

      // 3. Upload to our R2 storage
      const folder = `trips/${tripId}/media`
      const fileName = `unsplash-${photo.id}.jpg`
      const { url: fileUrl } = await this.storageService.uploadMediaFile(
        buffer,
        folder,
        fileName,
        contentType
      )

      // 4. Trigger Unsplash download tracking (required by API guidelines)
      this.logger.debug('Triggering Unsplash download tracking')
      await this.unsplashService.triggerDownload(body.downloadLocation)

      // 5. Create database record with attribution
      const media = await this.mediaService.addExternal(tripId, body, {
        urls: { regular: fileUrl, small: photo.urls.small },
        user: photo.user,
        links: photo.links,
        description: photo.description,
      })

      this.logger.log(
        `Added Unsplash photo ${photo.id} by ${photo.user.name} to trip ${tripId}`
      )

      return media
    } catch (error) {
      this.logger.error(`Failed to add external media: ${error}`)
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(
        `Failed to add Unsplash photo: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update media metadata (caption, orderIndex)
   * PATCH /trips/:tripId/media/:mediaId
   */
  @Patch(':mediaId')
  async update(
    @Param('tripId') tripId: string,
    @Param('mediaId') mediaId: string,
    @Body() body: UpdateTripMediaDto
  ) {
    return this.mediaService.update(mediaId, tripId, body)
  }

  /**
   * Set media as cover photo
   * PATCH /trips/:tripId/media/:mediaId/set-cover
   */
  @Patch(':mediaId/set-cover')
  async setCoverPhoto(
    @Param('tripId') tripId: string,
    @Param('mediaId') mediaId: string
  ) {
    return this.mediaService.setCoverPhoto(mediaId, tripId)
  }

  /**
   * Remove cover photo designation
   * PATCH /trips/:tripId/media/:mediaId/remove-cover
   */
  @Patch(':mediaId/remove-cover')
  async removeCoverPhoto(
    @Param('tripId') tripId: string,
    @Param('mediaId') mediaId: string
  ) {
    return this.mediaService.removeCoverPhoto(mediaId, tripId)
  }

  /**
   * Delete a media item
   * DELETE /trips/:tripId/media/:mediaId
   */
  @Delete(':mediaId')
  async delete(
    @Param('tripId') tripId: string,
    @Param('mediaId') mediaId: string
  ) {
    // Get media to get file URL for storage deletion
    const media = await this.mediaService.findById(mediaId, tripId)

    // Extract storage path from public URL for deletion
    const urlParts = media.fileUrl.split('.r2.dev/')
    const storagePath = urlParts.length > 1 ? urlParts[1] : null

    // Delete from storage
    if (storagePath && this.storageService.isMediaAvailable()) {
      try {
        await this.storageService.deleteMedia(storagePath)
      } catch (error) {
        // Log but don't fail - database record should still be deleted
        this.logger.error('Failed to delete file from media storage:', error)
      }
    }

    // Delete database record (will also clear cover if needed)
    await this.mediaService.delete(mediaId, tripId)

    return { success: true }
  }
}
