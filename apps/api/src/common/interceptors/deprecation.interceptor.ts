import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { EventEmitter2 } from '@nestjs/event-emitter'

export interface DeprecationOptions {
  sunsetDate: string // ISO date string
  successorPath: string
  notice?: string
}

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeprecationInterceptor.name)

  constructor(
    private readonly options: DeprecationOptions,
    private readonly eventEmitter?: EventEmitter2
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    // Add RFC 8594 deprecation headers
    response.setHeader('Deprecation', 'true')
    response.setHeader('Sunset', new Date(this.options.sunsetDate).toUTCString())
    response.setHeader('Link', `<${this.options.successorPath}>; rel="successor-version"`)
    response.setHeader('X-Deprecation-Notice',
      this.options.notice || `This endpoint will be removed on ${this.options.sunsetDate}. Use ${this.options.successorPath} instead.`
    )

    // Log usage for tracking
    this.logger.warn(`Deprecated route accessed: ${request.method} ${request.url}`)

    // Emit event for tracking (if event emitter available)
    if (this.eventEmitter) {
      this.eventEmitter.emit('legacy.route.accessed', {
        route: request.route?.path || request.url,
        method: request.method,
        timestamp: new Date(),
        userAgent: request.headers['user-agent'],
      })
    }

    return next.handle()
  }
}
