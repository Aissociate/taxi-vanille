import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { NotificationsService } from '../common/notifications.service';
import { StorageService } from '../common/storage.service';

@Module({
  controllers: [DriversController],
  providers: [DriversService, NotificationsService, StorageService],
  exports: [DriversService],
})
export class DriversModule {}
