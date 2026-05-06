import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { GpsModule } from '../gps/gps.module';
import { NotificationsService } from '../common/notifications.service';

@Module({
  imports: [GpsModule],
  controllers: [TripsController],
  providers: [TripsService, NotificationsService],
  exports: [TripsService],
})
export class TripsModule {}
