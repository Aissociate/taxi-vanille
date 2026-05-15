import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { StorageService } from '../common/storage.service';
import { NotificationsService } from '../common/notifications.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, StorageService, NotificationsService],
})
export class InvoicesModule {}
