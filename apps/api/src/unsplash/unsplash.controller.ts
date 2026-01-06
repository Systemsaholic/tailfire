/**
 * Unsplash Controller
 *
 * API endpoints for searching Unsplash stock photos.
 */

import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UnsplashService } from './unsplash.service'

@ApiTags('Unsplash')
@Controller('unsplash')
export class UnsplashController {
  constructor(private readonly unsplashService: UnsplashService) {}

  /**
   * Check if Unsplash API is available
   *
   * GET /unsplash/status
   */
  @Get('status')
  getStatus() {
    return {
      available: this.unsplashService.isAvailable(),
      message: this.unsplashService.isAvailable()
        ? 'Unsplash API is configured and ready'
        : 'Unsplash API not configured. Set UNSPLASH_ACCESS_KEY in environment.',
    }
  }

  /**
   * Search for photos
   *
   * GET /unsplash/search?query=beach&page=1&perPage=20
   */
  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required')
    }

    const pageNum = page ? parseInt(page, 10) : 1
    const perPageNum = perPage ? parseInt(perPage, 10) : 20

    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Page must be a positive number')
    }

    if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 30) {
      throw new BadRequestException('perPage must be between 1 and 30')
    }

    const response = await this.unsplashService.searchPhotos(
      query.trim(),
      pageNum,
      perPageNum
    )

    // Transform response to match frontend types
    return {
      total: response.total,
      totalPages: response.total_pages,
      results: response.results.map((photo) => ({
        id: photo.id,
        description: photo.description,
        altDescription: photo.alt_description,
        urls: photo.urls,
        user: {
          name: photo.user.name,
          username: photo.user.username,
          links: {
            html: photo.user.links.html,
          },
        },
        links: {
          html: photo.links.html,
          download_location: photo.links.download_location,
        },
        width: photo.width,
        height: photo.height,
      })),
    }
  }
}
