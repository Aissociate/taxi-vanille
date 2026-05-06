import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards';
import { StartTripDto, StopEventDto, EndTripDto } from './trips.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly service: TripsService) {}

  @Post(':id/start')
  start(
    @Param('id') id: string,
    @Body() dto: StartTripDto,
    @Request() req,
  ) {
    return this.service.startTrip(id, req.user.userId, dto);
  }

  @Post(':id/stops/:stopId/event')
  stopEvent(
    @Param('id') tripId: string,
    @Param('stopId') stopId: string,
    @Body() dto: StopEventDto,
    @Request() req,
  ) {
    return this.service.recordStopEvent(tripId, stopId, req.user.userId, dto);
  }

  @Post(':id/end')
  end(@Param('id') id: string, @Body() dto: EndTripDto, @Request() req) {
    return this.service.endTrip(id, req.user.userId, dto);
  }

  @Get(':id/events')
  events(@Param('id') id: string) {
    return this.service.getTripEvents(id);
  }

  // Sync batch hors-ligne
  @Post('batch-sync')
  batchSync(@Body() body: { events: any[] }, @Request() req) {
    return this.service.batchSync(req.user.userId, body.events);
  }
}
