import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { StorageService } from '../common/storage.service';

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, StorageService],
})
export class IncidentsModule {}
