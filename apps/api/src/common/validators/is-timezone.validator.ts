/**
 * Custom Timezone Validator Decorator
 *
 * Validates that a string value is a valid IANA timezone identifier.
 * Uses the shared timezone validation from @tailfire/shared-types.
 */

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { dateUtils } from '@tailfire/shared-types'

export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Allow null/undefined (use @IsOptional() for optional fields)
          if (value === null || value === undefined) {
            return true
          }

          // Must be a string
          if (typeof value !== 'string') {
            return false
          }

          // Validate against IANA timezone list
          return dateUtils.isValidTimezone(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid IANA timezone identifier (e.g., 'America/Toronto', 'Europe/London')`
        },
      },
    })
  }
}
