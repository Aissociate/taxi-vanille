import { Controller, Get, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  @Get()
  async check() {
    let dbOk = false;
    try {
      await sql`SELECT 1`.execute(this.db);
      dbOk = true;
    } catch {
      dbOk = false;
    }
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
