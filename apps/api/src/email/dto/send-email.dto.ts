/**
 * Send Email DTO
 * Request body for sending a single email
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsUUID,
  IsNotEmpty,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class SendEmailDto {
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

  @IsString()
  @IsNotEmpty()
  subject!: string

  @IsString()
  @IsNotEmpty()
  html!: string

  @IsOptional()
  @IsString()
  text?: string

  @IsOptional()
  @IsEmail()
  replyTo?: string

  // Context references for logging
  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @IsUUID()
  activityId?: string
}
