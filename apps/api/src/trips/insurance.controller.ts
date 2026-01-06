/**
 * Insurance Controller
 *
 * REST API endpoints for trip insurance packages and per-traveler insurance tracking.
 * Nested under /trips/:tripId/insurance/*
 *
 * TODO: Add @UseGuards(AuthGuard) when authentication is implemented (Phase 4)
 * TODO: Add tenant scoping to ensure users can only access their own agency's trips
 * TODO: Extract agencyId from JWT context instead of relying on trip ownership check alone
 *
 * @see AUTH_INTEGRATION.md for authentication implementation requirements
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InsuranceService } from './insurance.service'
import type {
  TripInsurancePackageDto,
  CreateTripInsurancePackageDto,
  UpdateTripInsurancePackageDto,
  TripInsurancePackagesListDto,
  TripTravelerInsuranceDto,
  CreateTripTravelerInsuranceDto,
  UpdateTripTravelerInsuranceDto,
  TripTravelersInsuranceListDto,
} from '@tailfire/shared-types'

@ApiTags('Insurance')
@Controller('trips/:tripId/insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // ============================================================================
  // Insurance Packages
  // ============================================================================

  /**
   * GET /trips/:tripId/insurance/packages
   * List all insurance packages for a trip
   */
  @Get('packages')
  async getPackages(@Param('tripId') tripId: string): Promise<TripInsurancePackagesListDto> {
    return this.insuranceService.getPackages(tripId)
  }

  /**
   * POST /trips/:tripId/insurance/packages
   * Create a new insurance package
   */
  @Post('packages')
  async createPackage(
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripInsurancePackageDto
  ): Promise<TripInsurancePackageDto> {
    return this.insuranceService.createPackage(tripId, dto)
  }

  /**
   * GET /trips/:tripId/insurance/packages/:packageId
   * Get a single insurance package
   */
  @Get('packages/:packageId')
  async getPackage(
    @Param('tripId') tripId: string,
    @Param('packageId') packageId: string
  ): Promise<TripInsurancePackageDto> {
    return this.insuranceService.getPackage(tripId, packageId)
  }

  /**
   * PATCH /trips/:tripId/insurance/packages/:packageId
   * Update an insurance package
   */
  @Patch('packages/:packageId')
  async updatePackage(
    @Param('tripId') tripId: string,
    @Param('packageId') packageId: string,
    @Body() dto: UpdateTripInsurancePackageDto
  ): Promise<TripInsurancePackageDto> {
    return this.insuranceService.updatePackage(tripId, packageId, dto)
  }

  /**
   * DELETE /trips/:tripId/insurance/packages/:packageId
   * Delete an insurance package
   */
  @Delete('packages/:packageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePackage(
    @Param('tripId') tripId: string,
    @Param('packageId') packageId: string
  ): Promise<void> {
    return this.insuranceService.deletePackage(tripId, packageId)
  }

  // ============================================================================
  // Traveler Insurance
  // ============================================================================

  /**
   * GET /trips/:tripId/insurance/travelers
   * List all traveler insurance records for a trip
   */
  @Get('travelers')
  async getTravelerInsurance(
    @Param('tripId') tripId: string
  ): Promise<TripTravelersInsuranceListDto> {
    return this.insuranceService.getTravelerInsurance(tripId)
  }

  /**
   * POST /trips/:tripId/insurance/travelers
   * Create a traveler insurance record
   */
  @Post('travelers')
  async createTravelerInsurance(
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripTravelerInsuranceDto
  ): Promise<TripTravelerInsuranceDto> {
    return this.insuranceService.createTravelerInsurance(tripId, dto)
  }

  /**
   * GET /trips/:tripId/insurance/travelers/:insuranceId
   * Get a single traveler insurance record
   */
  @Get('travelers/:insuranceId')
  async getTravelerInsuranceById(
    @Param('tripId') tripId: string,
    @Param('insuranceId') insuranceId: string
  ): Promise<TripTravelerInsuranceDto> {
    return this.insuranceService.getTravelerInsuranceById(tripId, insuranceId)
  }

  /**
   * PATCH /trips/:tripId/insurance/travelers/:insuranceId
   * Update a traveler insurance record
   */
  @Patch('travelers/:insuranceId')
  async updateTravelerInsurance(
    @Param('tripId') tripId: string,
    @Param('insuranceId') insuranceId: string,
    @Body() dto: UpdateTripTravelerInsuranceDto
  ): Promise<TripTravelerInsuranceDto> {
    return this.insuranceService.updateTravelerInsurance(tripId, insuranceId, dto)
  }

  /**
   * DELETE /trips/:tripId/insurance/travelers/:insuranceId
   * Delete a traveler insurance record
   */
  @Delete('travelers/:insuranceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTravelerInsurance(
    @Param('tripId') tripId: string,
    @Param('insuranceId') insuranceId: string
  ): Promise<void> {
    return this.insuranceService.deleteTravelerInsurance(tripId, insuranceId)
  }
}
