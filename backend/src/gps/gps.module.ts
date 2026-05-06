import { Module } from '@nestjs/common';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';

@Module({
  controllers: [GpsController],
  providers: [GpsService, GpsGateway],
  exports: [GpsGateway, GpsService],
})
export class GpsModule {}
