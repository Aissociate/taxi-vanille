import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, AuditService],
})
export class ClientsModule {}
