import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('direction', 'coordinator')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @Get(':section')
  getSection(@Param('section') section: string) { return this.service.getSection(section); }

  @Put(':section')
  @Roles('direction')
  upsert(@Param('section') section: string, @Body() body: unknown, @Request() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.upsert(section, body, userId);
  }
}
