/**
 * Invite User DTO
 *
 * Validation for email-based user invitation.
 */

import {
  IsString,
  IsEmail,
  MaxLength,
  IsIn,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

/**
 * Custom validator: Checks that email local part (before @) is <= 64 chars per RFC 5321
 */
function IsValidEmailLocalPart(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmailLocalPart',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return false
          const localPart = value.split('@')[0]
          return localPart ? localPart.length <= 64 : true
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Email local part (before @) must be 64 characters or fewer'
        },
      },
    })
  }
}

export class InviteUserDto {
  @IsEmail()
  @IsValidEmailLocalPart()
  @MaxLength(255)
  email!: string

  @IsString()
  @MaxLength(100)
  firstName!: string

  @IsString()
  @MaxLength(100)
  lastName!: string

  @IsIn(['admin', 'user'])
  role!: 'admin' | 'user'
}
