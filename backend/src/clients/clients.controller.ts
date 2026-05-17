import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateClientDto, DailyStatsQueryDto, DirectionStatsQueryDto, SaveReportDto } from './clients.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('direction', 'coordinator')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  // ── Clients ──────────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ⚠ Ce route doit être AVANT @Get(':id') pour ne pas être interceptée
  @Get('lines')
  getClientLines() {
    return this.service.getClientLines();
  }

  @Post(':id/lines')
  @Roles('direction')
  createLine(@Param('id') id: string, @Body() dto: any) {
    return this.service.createLine(id, dto);
  }

  // ⚠ Idem : avant @Get(':id')
  @Get('reports')
  @Roles('direction')
  listAllReports() {
    return this.service.listReports();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('direction')
  create(@Body() dto: CreateClientDto, @Req() req: any) {
    return this.service.create(dto, req.user?.sub ?? req.user?.id);
  }

  @Put(':id')
  @Roles('direction')
  update(@Param('id') id: string, @Body() dto: CreateClientDto, @Req() req: any) {
    return this.service.update(id, dto, req.user?.sub ?? req.user?.id);
  }

  // ── Rapport agrégé (ancien endpoint) ─────────────────────────────────────────

  @Get(':id/report')
  @Roles('direction')
  report(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getReport(id, from, to);
  }

  // ── Stats journalières ────────────────────────────────────────────────────────

  @Get(':id/daily-stats')
  dailyStats(
    @Param('id') id: string,
    @Query() q: DailyStatsQueryDto,
  ) {
    return this.service.getDailyStats(id, q.from, q.to, q.line_id);
  }

  // ── Stats par direction ───────────────────────────────────────────────────────

  @Get(':id/direction-stats')
  directionStats(
    @Param('id') id: string,
    @Query() q: DirectionStatsQueryDto,
  ) {
    return this.service.getDirectionStats(id, q.from, q.to, q.line_id);
  }

  // ── Archive rapports ──────────────────────────────────────────────────────────

  @Get(':id/reports')
  @Roles('direction')
  listReports(@Param('id') id: string) {
    return this.service.listReports(id);
  }

  @Post(':id/reports')
  @Roles('direction')
  saveReport(
    @Param('id') id: string,
    @Body() dto: SaveReportDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.saveReport(id, dto, userId);
  }

  @Delete(':id/reports/:reportId')
  @Roles('direction')
  deleteReport(@Param('reportId') reportId: string) {
    return this.service.deleteReport(reportId);
  }
}
