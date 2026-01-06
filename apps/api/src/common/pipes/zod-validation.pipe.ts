/**
 * Zod Validation Pipe
 *
 * NestJS pipe for validating request bodies with Zod schemas.
 * Use with @UsePipes decorator on controller methods.
 */

import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common'
import { ZodSchema, ZodError } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // Only validate body parameters
    if (metadata.type !== 'body') {
      return value
    }

    const result = this.schema.safeParse(value)

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.formatErrors(result.error),
      })
    }

    return result.data
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!errors[path]) errors[path] = []
      errors[path].push(issue.message)
    }
    return errors
  }
}

/**
 * Factory helper to create ZodValidationPipe instances.
 * Avoids inline instantiation in decorators.
 *
 * @example
 * @UsePipes(zodValidation(createActivityDtoSchema))
 * async create(@Body() dto: CreateActivityDto) { ... }
 */
export function zodValidation(schema: ZodSchema): ZodValidationPipe {
  return new ZodValidationPipe(schema)
}
