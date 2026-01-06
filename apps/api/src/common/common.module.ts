import { Module, Global } from '@nestjs/common'

// DeprecationTrackingService archived to _deprecated/ (was only used by legacy BookingsController)

@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}
