import { Module } from '@nestjs/common'
import { DatabaseModule } from '../db/database.module'
import { EmailService } from './email.service'
import { EmailTemplatesService } from './email-templates.service'
import { VariableResolverService } from './variable-resolver.service'
import { EmailController } from './email.controller'
import { EmailTemplatesController } from './email-templates.controller'

@Module({
  imports: [DatabaseModule],
  providers: [EmailService, EmailTemplatesService, VariableResolverService],
  controllers: [EmailController, EmailTemplatesController],
  exports: [EmailService, EmailTemplatesService, VariableResolverService],
})
export class EmailModule {}
