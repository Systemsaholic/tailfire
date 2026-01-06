import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    }
  }

  getInfo() {
    return {
      name: 'Tailfire Beta API',
      version: '1.0.0',
      description: 'Next-generation travel agency management system',
      apiPrefix: process.env.API_PREFIX || 'api/v1',
      documentation: process.env.ENABLE_SWAGGER_DOCS === 'true'
        ? `/${process.env.API_PREFIX || 'api/v1'}/docs`
        : null,
    }
  }
}
