/**
 * Send Templated Email DTO
 * Request body for sending an email using a template
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsUUID,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class EmailContextDto {
  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @IsUUID()
  activityId?: string

  @IsOptional()
  @IsUUID()
  agentId?: string

  @IsOptional()
  @IsObject()
  customVariables?: Record<string, string>
}

export class SendTemplatedEmailDto {
  @IsString()
  @IsNotEmpty()
  templateSlug!: string

  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  to!: string[]

  @IsOptional()
  @Transform(({ value }) => value ? (Array.isArray(value) ? value : [value]) : undefined)
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[]

  @IsOptional()
  @Transform(({ value }) => value ? (Array.isArray(value) ? value : [value]) : undefined)
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[]

  @IsOptional()
  @IsEmail()
  replyTo?: string

  @ValidateNested()
  @Type(() => EmailContextDto)
  context!: EmailContextDto

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>
}
