import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriversService } from './drivers.service';
import { StorageService } from '../common/storage.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateDriverDto, UpdateDriverDto, UpdateFcmTokenDto, CreateAdvanceDto, AddRepaymentDto, DeclareOdometerDto } from './drivers.dto';
import { randomUUID } from 'crypto';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private readonly service: DriversService,
    private readonly storage: StorageService,
  ) {}

  // ── Routes "me" — MUST be before :id routes ──────────────────────────────
  // Ces routes sont réservées aux chauffeurs (app Android)

  // Profil du chauffeur connecté (app Android)
  @Get('me')
  @Roles('driver')
  myProfile(@Request() req) {
    return this.service.getMyProfile(req.user.userId);
  }

  // Planning du jour pour le chauffeur connecté (app Android)
  @Get('me/schedule/today')
  @Roles('driver')
  mySchedule(@Request() req) {
    return this.service.getTodaySchedule(req.user.userId);
  }

  // Android : lecture du mois courant
  @Get('me/mileage/current')
  @Roles('driver')
  getCurrentMileage(@Request() req) {
    const month = new Date().toISOString().slice(0, 7);
    return this.service.getMileageForMonth(req.user.userId, month);
  }

  // Android : déclaration début ou fin de mois
  @Post('me/mileage')
  @Roles('driver')
  declareOdometer(@Request() req, @Body() dto: DeclareOdometerDto) {
    return this.service.declareOdometer(req.user.userId, dto);
  }

  @Put('me/fcm-token')
  @Roles('driver')
  updateFcmToken(@Request() req, @Body() dto: UpdateFcmTokenDto) {
    return this.service.updateFcmToken(req.user.userId, dto.token);
  }

  // ── Routes génériques ─────────────────────────────────────────────────────

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

  @Get(':id/stats')
  @Roles('direction', 'coordinator')
  getStats(@Param('id') id: string, @Query('period') period = 'semaine') {
    return this.service.getStats(id, period);
  }

  @Post()
  @Roles('direction')
  create(@Body() dto: CreateDriverDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub ?? req.user?.id);
  }

  @Put(':id')
  @Roles('direction')
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub ?? req.user?.id);
  }

  @Put(':id/deactivate')
  @Roles('direction')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.service.setActive(id, false, req.user?.sub ?? req.user?.id);
  }

  // ── Acomptes ──────────────────────────────────────────────────────────────

  @Get(':id/advances')
  @Roles('direction', 'coordinator')
  getAdvances(@Param('id') id: string) {
    return this.service.findAdvances(id);
  }

  @Post(':id/advances')
  @Roles('direction')
  createAdvance(@Param('id') id: string, @Body() dto: CreateAdvanceDto) {
    return this.service.createAdvance(id, dto);
  }

  @Post(':id/advances/:advId/repayments')
  @Roles('direction')
  addRepayment(@Param('advId') advId: string, @Body() dto: AddRepaymentDto) {
    return this.service.addRepayment(advId, dto);
  }

  @Delete(':id/advances/:advId')
  @Roles('direction')
  @HttpCode(200)
  deleteAdvance(@Param('advId') advId: string) {
    return this.service.deleteAdvance(advId);
  }

  @Delete(':id/advances/:advId/repayments/:repId')
  @Roles('direction')
  @HttpCode(200)
  deleteRepayment(@Param('repId') repId: string) {
    return this.service.deleteRepayment(repId);
  }

  // ── Kilométrages ──────────────────────────────────────────────────────────

  // Web : historique complet d'un chauffeur
  @Get(':id/mileages')
  @Roles('direction', 'coordinator')
  getMileages(@Param('id') id: string) {
    return this.service.findMileages(id);
  }

  // Web : saisie kilométrage pour n'importe quel chauffeur (coordinateur / direction)
  @Post(':id/mileage-override')
  @Roles('direction', 'coordinator')
  mileageOverride(@Param('id') driverId: string, @Body() dto: DeclareOdometerDto) {
    return this.service.declareOdometer(driverId, dto);
  }

  // ── Documents (stockage S3) ────────────────────────────────────────────────

  @Post(':id/documents/upload')
  @Roles('direction', 'coordinator')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDocument(
    @Param('id') driverId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const key = `drivers/${driverId}/docs/${randomUUID()}.${ext}`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    return { key, filename: file.originalname, size: file.size, mime: file.mimetype };
  }

  @Get('documents/signed-url')
  @Roles('direction', 'coordinator')
  async getSignedUrl(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key requis');
    const url = await this.storage.getSignedUrl(key, 3600);
    return { url };
  }

  @Delete('documents')
  @Roles('direction')
  async deleteDocument(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key requis');
    await this.storage.delete(key);
    return { ok: true };
  }
}
