import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateTripDto, UpdateTripDto, ReplaceDriverDto } from './planning.dto';

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('direction', 'coordinator')
export class PlanningController {
  constructor(private readonly service: PlanningService) {}

  @Get()
  findAll(
    @Query('date') date?: string,
    @Query('driver_id') driverId?: string,
    @Query('client_id') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ date, driverId, clientId, status });
  }

  @Get('audit')
  getAudit(
    @Query('trip_id') tripId?: string,
    @Query('limit') limit = '50',
  ) {
    return this.service.getAudit(tripId, parseInt(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTripDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTripDto, @Request() req) {
    return this.service.update(id, dto, req.user.userId);
  }

  @Put(':id/driver')
  replaceDriver(@Param('id') id: string, @Body() dto: ReplaceDriverDto, @Request() req) {
    return this.service.replaceDriver(id, dto.driver_id, dto.reason, req.user.userId);
  }

  @Delete(':id')
  @Roles('direction')
  cancel(@Param('id') id: string, @Request() req) {
    return this.service.cancelTrip(id, req.user.userId);
  }
}
