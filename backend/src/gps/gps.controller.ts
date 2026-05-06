import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GpsService } from './gps.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { GpsPingDto, GpsBatchDto } from './gps.dto';

@Controller('gps')
@UseGuards(JwtAuthGuard)
export class GpsController {
  constructor(private readonly service: GpsService) {}

  @Post('ping')
  ping(@Body() dto: GpsPingDto, @Request() req) {
    return this.service.recordPing(req.user.userId, dto);
  }

  @Post('batch')
  batchPing(@Body() dto: GpsBatchDto, @Request() req) {
    return this.service.recordBatch(req.user.userId, dto.pings);
  }

  @Get('live')
  @UseGuards(RolesGuard)
  @Roles('direction', 'coordinator')
  livePositions() {
    return this.service.getLivePositions();
  }

  @Get('history/:driverId')
  @UseGuards(RolesGuard)
  @Roles('direction', 'coordinator')
  history(
    @Param('driverId') driverId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req,
  ) {
    const maxDays = req.user.role === 'coordinator' ? 7 : 90;
    return this.service.getHistory(driverId, from, to, maxDays);
  }
}
