import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { StorageService } from '../common/storage.service';
import { NotificationsService } from '../common/notifications.service';

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, StorageService, NotificationsService],
})
export class IncidentsModule {}
