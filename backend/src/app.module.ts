import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { TripsModule } from './trips/trips.module';
import { PlanningModule } from './planning/planning.module';
import { IncidentsModule } from './incidents/incidents.module';
import { GpsModule } from './gps/gps.module';
import { InvoicesModule } from './invoices/invoices.module';
import { KpiModule } from './kpi/kpi.module';
import { ClientsModule } from './clients/clients.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    DriversModule,
    TripsModule,
    PlanningModule,
    IncidentsModule,
    GpsModule,
    InvoicesModule,
    KpiModule,
    ClientsModule,
    SettingsModule,
  ],
})
export class AppModule {}
