import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateIncidentDto } from './incidents.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  // Création d'un incident — ouvert aux chauffeurs (app Android) et au dashboard
  @Post()
  @UseGuards(RolesGuard)
  @Roles('driver', 'direction', 'coordinator')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 2 * 1024 * 1024 } }))
  create(
    @Body() dto: CreateIncidentDto,
    @Request() req,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    return this.service.create(req.user.userId, dto, audio);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('direction', 'coordinator')
  findAll(
    @Query('driver_id') driverId?: string,
    @Query('trip_id') tripId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ driverId, tripId, from, to });
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('direction', 'coordinator')
  resolve(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub ?? req.user?.userId ?? req.user?.id;
    return this.service.resolve(id, userId);
  }

  @Get(':id/audio')
  @UseGuards(RolesGuard)
  @Roles('direction', 'coordinator')
  getAudioUrl(@Param('id') id: string, @Request() req) {
    return this.service.getSignedAudioUrl(id, req.user.userId);
  }
}
