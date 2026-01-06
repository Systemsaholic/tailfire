/**
 * Tests for IsTimezone Validator Decorator
 *
 * Tests the custom timezone validation decorator used in DTOs.
 */

import { validate, IsNotEmpty, IsOptional } from 'class-validator'
import { IsTimezone } from '../is-timezone.validator'

class TestDto {
  @IsNotEmpty()
  @IsTimezone()
  timezone!: string
}

class OptionalTestDto {
  @IsOptional()
  @IsTimezone()
  timezone?: string
}

describe('IsTimezone Validator', () => {
  describe('with required timezone', () => {
    it('should pass validation for valid IANA timezones', async () => {
      const validTimezones = [
        'America/Toronto',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC',
        'America/Los_Angeles',
        'Australia/Sydney',
      ]

      for (const tz of validTimezones) {
        const dto = new TestDto()
        dto.timezone = tz

        const errors = await validate(dto)
        expect(errors.length).toBe(0)
      }
    })

    it('should fail validation for invalid timezones', async () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'EST', // Abbreviations not allowed
        'America/Invalid',
        'america/toronto', // Case-sensitive
        'GMT', // Abbreviation
        '',
      ]

      for (const tz of invalidTimezones) {
        const dto = new TestDto()
        dto.timezone = tz

        const errors = await validate(dto)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors[0]!.property).toBe('timezone')
      }
    })

    it('should fail validation for null or undefined', async () => {
      const dto = new TestDto()
      dto.timezone = null as any

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should fail validation for non-string values', async () => {
      const dto = new TestDto()
      dto.timezone = 123 as any

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should have a descriptive error message', async () => {
      const dto = new TestDto()
      dto.timezone = 'Invalid'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]!.constraints).toBeDefined()

      const errorMessage = Object.values(errors[0]!.constraints || {})[0]
      expect(errorMessage).toContain('IANA timezone identifier')
      expect(errorMessage).toContain('timezone')
    })
  })

  describe('with optional timezone', () => {
    it('should pass validation when timezone is undefined', async () => {
      const dto = new OptionalTestDto()
      // timezone is undefined

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should pass validation when timezone is valid', async () => {
      const dto = new OptionalTestDto()
      dto.timezone = 'America/Toronto'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when timezone is invalid', async () => {
      const dto = new OptionalTestDto()
      dto.timezone = 'Invalid/Timezone'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
