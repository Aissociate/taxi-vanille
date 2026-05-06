import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('direction', 'coordinator')
export class KpiController {
  constructor(private readonly service: KpiService) {}

  @Get('dashboard')
  dashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('driver_id') driverId?: string,
    @Query('client_id') clientId?: string,
  ) {
    return this.service.getDashboard({ from, to, driverId, clientId });
  }
}
