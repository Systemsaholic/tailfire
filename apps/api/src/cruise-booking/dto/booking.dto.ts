/**
 * Booking DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PassengerAddressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  street!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  state!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  zip!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  country!: string
}

export class PassengerDto {
  @ApiProperty({ description: 'Title: Mr, Mrs, Ms, Dr' })
  @IsNotEmpty()
  @IsString()
  title!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstname!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastname!: string

  @ApiProperty({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  dateofbirth!: string

  @ApiProperty({ description: 'Country code (e.g., US, CA, GB)' })
  @IsNotEmpty()
  @IsString()
  nationality!: string

  @ApiPropertyOptional({ description: 'Passport number' })
  @IsOptional()
  @IsString()
  passportnumber?: string

  @ApiPropertyOptional({ description: 'Passport expiry date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  passportexpiry?: string

  @ApiPropertyOptional({ description: 'Cruise line loyalty number' })
  @IsOptional()
  @IsString()
  pastpaxid?: string
}

export class ContactDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone!: string

  @ApiPropertyOptional({ type: PassengerAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PassengerAddressDto)
  address?: PassengerAddressDto
}

export class DiningPreferencesDto {
  @ApiProperty({ enum: ['early', 'late', 'open', 'anytime'] })
  @IsNotEmpty()
  @IsEnum(['early', 'late', 'open', 'anytime'])
  seating!: 'early' | 'late' | 'open' | 'anytime'

  @ApiPropertyOptional({ description: 'Preferred table size' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  tablesize?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smoking?: boolean
}

export class AllocationDto {
  @ApiPropertyOptional({ type: DiningPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiningPreferencesDto)
  dining?: DiningPreferencesDto

  @ApiPropertyOptional({ description: 'Bed configuration: twin, queen, king' })
  @IsOptional()
  @IsString()
  bedconfig?: string
}

export class PaymentDto {
  @ApiProperty({ enum: ['deposit', 'full'] })
  @IsNotEmpty()
  @IsEnum(['deposit', 'full'])
  type!: 'deposit' | 'full'

  @ApiPropertyOptional({ description: 'Payment amount' })
  @IsOptional()
  @Type(() => Number)
  amount?: number
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Session ID from basket add' })
  @IsNotEmpty()
  @IsUUID()
  sessionId!: string

  @ApiProperty({ description: 'Client-generated UUID for idempotency' })
  @IsNotEmpty()
  @IsUUID()
  idempotencyKey!: string

  @ApiProperty({ type: [PassengerDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers!: PassengerDto[]

  @ApiProperty({ type: ContactDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto

  @ApiPropertyOptional({ type: AllocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AllocationDto)
  allocation?: AllocationDto

  @ApiPropertyOptional({ type: PaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDto)
  payment?: PaymentDto
}

export class BookingResponseDto {
  @ApiProperty()
  success!: boolean

  @ApiPropertyOptional()
  bookingreference?: string

  @ApiPropertyOptional()
  confirmationdate?: string

  @ApiPropertyOptional()
  totalprice?: number

  @ApiPropertyOptional()
  currency?: string

  @ApiPropertyOptional()
  depositdue?: number

  @ApiPropertyOptional()
  balancedue?: number

  @ApiPropertyOptional()
  balanceduedate?: string
}
