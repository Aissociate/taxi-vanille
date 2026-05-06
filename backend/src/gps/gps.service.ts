import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { GpsGateway } from './gps.gateway';
import { GpsPingDto } from './gps.dto';
import { subDays } from 'date-fns';

@Injectable()
export class GpsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly gateway: GpsGateway,
  ) {}

  async recordPing(driverId: string, dto: GpsPingDto) {
    const recorded_at = dto.recorded_at ? new Date(dto.recorded_at) : new Date();

    await this.db.insertInto('gps_pings').values({
      driver_id: driverId,
      trip_id: dto.trip_id ?? null,
      lat: dto.lat,
      lng: dto.lng,
      accuracy_m: dto.accuracy_m ?? null,
      recorded_at,
    }).execute();

    this.gateway.broadcastPosition({ driver_id: driverId, trip_id: dto.trip_id, lat: dto.lat, lng: dto.lng, recorded_at });
    return { ok: true };
  }

  async recordBatch(driverId: string, pings: GpsPingDto[]) {
    if (!pings?.length) return { ok: true, count: 0 };
    const rows = pings.map(p => ({
      driver_id: driverId,
      trip_id: p.trip_id ?? null,
      lat: p.lat,
      lng: p.lng,
      accuracy_m: p.accuracy_m ?? null,
      recorded_at: p.recorded_at ? new Date(p.recorded_at) : new Date(),
    }));
    await this.db.insertInto('gps_pings').values(rows).execute();
    const last = rows[rows.length - 1];
    this.gateway.broadcastPosition({ driver_id: driverId, lat: last.lat, lng: last.lng, recorded_at: last.recorded_at });
    return { ok: true, count: rows.length };
  }

  async getLivePositions() {
    // Dernière position connue de chaque chauffeur actif (dans les 5 dernières minutes)
    const since = new Date(Date.now() - 5 * 60 * 1000);
    return this.db
      .selectFrom(
        this.db
          .selectFrom('gps_pings as g')
          .innerJoin('drivers as d', 'd.id', 'g.driver_id')
          .select([
            'g.driver_id', 'd.driver_number', 'd.full_name',
            'g.lat', 'g.lng', 'g.trip_id', 'g.recorded_at',
            sql<number>`row_number() over (partition by g.driver_id order by g.recorded_at desc)`.as('rn'),
          ])
          .where('g.recorded_at', '>=', since)
          .as('ranked'),
      )
      .selectAll()
      .where('rn', '=', 1)
      .execute();
  }

  async getHistory(driverId: string, from: string, to: string, maxDays: number) {
    const fromDate = from ? new Date(from) : subDays(new Date(), 1);
    const toDate = to ? new Date(to) : new Date();
    const minDate = subDays(new Date(), maxDays);
    const effectiveFrom = fromDate < minDate ? minDate : fromDate;

    return this.db
      .selectFrom('gps_pings')
      .select(['lat', 'lng', 'trip_id', 'accuracy_m', 'recorded_at'])
      .where('driver_id', '=', driverId)
      .where('recorded_at', '>=', effectiveFrom)
      .where('recorded_at', '<=', toDate)
      .orderBy('recorded_at')
      .execute();
  }
}
