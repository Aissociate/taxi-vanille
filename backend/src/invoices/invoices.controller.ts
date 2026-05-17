import { Controller, Get, Post, Put, Patch, Param, Query, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  @Roles('direction')
  findAll(
    @Query('driver_id') driverId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ driverId, status, month, from, to });
  }

  @Get('pricing-config')
  @Roles('direction')
  getPricingConfig() {
    return this.service.getPricingConfig();
  }

  @Put('pricing-config')
  @Roles('direction')
  updatePricingConfig(@Body() body: Record<string, any>) {
    return this.service.updatePricingConfig(body);
  }

  @Get(':id')
  @Roles('direction')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('generate')
  @Roles('direction')
  generate(@Body() body: { driver_id?: string; month: string }) {
    return this.service.generateMonthly(body.month, body.driver_id);
  }

  @Patch(':id')
  @Roles('direction')
  updateDraft(
    @Param('id') id: string,
    @Body() body: { on_call_hours?: number; vehicle_rental?: boolean; advance_repayment?: number; notes?: string },
  ) {
    return this.service.updateDraft(id, body);
  }

  @Put(':id/validate')
  @Roles('direction')
  validate(@Param('id') id: string, @Request() req) {
    return this.service.validate(id, req.user.userId);
  }

  @Put(':id/pay')
  @Roles('direction')
  markPaid(@Param('id') id: string, @Request() req: any) {
    return this.service.markPaid(id, req.user?.sub ?? req.user?.userId);
  }

  @Get(':id/pdf')
  @Roles('direction')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.service.getPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    pdf.stream.pipe(res);
  }
}
