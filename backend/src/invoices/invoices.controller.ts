import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Request, Res } from '@nestjs/common';
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
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ driverId, status, from, to });
  }

  @Post('generate')
  @Roles('direction')
  generate(
    @Body() body: { driver_id?: string; period: 'weekly' | 'monthly'; date: string },
  ) {
    return this.service.generate(body.driver_id, body.period, body.date);
  }

  @Put(':id/validate')
  @Roles('direction')
  validate(@Param('id') id: string, @Request() req) {
    return this.service.validate(id, req.user.userId);
  }

  @Put(':id/pay')
  @Roles('direction')
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
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
