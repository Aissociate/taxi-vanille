import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';

@Module({
  imports: [AuthModule],
  controllers: [GpsController],
  providers: [GpsService, GpsGateway],
  exports: [GpsGateway, GpsService],
})
export class GpsModule {}
