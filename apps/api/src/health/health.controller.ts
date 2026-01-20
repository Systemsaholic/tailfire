import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'

// Build info - captured at startup
const BUILD_INFO = {
  startedAt: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
}

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      build: BUILD_INFO,
    }
  }
}
