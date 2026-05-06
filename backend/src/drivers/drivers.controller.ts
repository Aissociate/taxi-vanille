import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateDriverDto, UpdateDriverDto, UpdateFcmTokenDto } from './drivers.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly service: DriversService) {}

  @Get()
  @Roles('direction', 'coordinator')
  findAll(@Query('active') active?: string) {
    return this.service.findAll(active !== 'false');
  }

  @Get(':id')
  @Roles('direction', 'coordinator')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('direction')
  create(@Body() dto: CreateDriverDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('direction')
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/deactivate')
  @Roles('direction')
  deactivate(@Param('id') id: string) {
    return this.service.setActive(id, false);
  }

  @Put('me/fcm-token')
  updateFcmToken(@Request() req, @Body() dto: UpdateFcmTokenDto) {
    return this.service.updateFcmToken(req.user.userId, dto.token);
  }

  // Planning du jour pour le chauffeur connecté (app Android)
  @Get('me/schedule/today')
  mySchedule(@Request() req) {
    return this.service.getTodaySchedule(req.user.userId);
  }
}
