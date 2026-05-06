import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { NotificationsService } from '../common/notifications.service';

@Module({
  controllers: [PlanningController],
  providers: [PlanningService, NotificationsService],
  exports: [PlanningService],
})
export class PlanningModule {}
