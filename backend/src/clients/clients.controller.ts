import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import { CreateClientDto } from './clients.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('direction', 'coordinator')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/report')
  @Roles('direction')
  report(@Param('id') id: string, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getReport(id, from, to);
  }

  @Post()
  @Roles('direction')
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('direction')
  update(@Param('id') id: string, @Body() dto: CreateClientDto) {
    return this.service.update(id, dto);
  }
}
