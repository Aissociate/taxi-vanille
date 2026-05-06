import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class KpiService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  async getDashboard(filters: { from?: string; to?: string; driverId?: string; clientId?: string }) {
    const from = filters.from ? new Date(filters.from) : startOfDay(subDays(new Date(), 30));
    const to = filters.to ? new Date(filters.to) : endOfDay(new Date());

    let tripsQ = this.db
      .selectFrom('trips')
      .where('scheduled_at', '>=', from)
      .where('scheduled_at', '<=', to);

    if (filters.driverId) tripsQ = tripsQ.where('driver_id', '=', filters.driverId);
    if (filters.clientId) tripsQ = tripsQ.where('client_id', '=', filters.clientId);

    const [totalStats] = await tripsQ
      .select([
        this.db.fn.count<number>('id').as('total_trips'),
        this.db.fn.countAll().filterWhere('status', '=', 'completed').as('completed_trips'),
        this.db.fn.sum<number>('amount').filterWhere('status', '=', 'completed').as('total_revenue'),
        this.db.fn.avg<number>('amount').filterWhere('status', '=', 'completed').as('avg_revenue_per_trip'),
      ])
      .execute();

    const passengerStats = await this.db
      .selectFrom('trip_events as te')
      .innerJoin('trips as t', 't.id', 'te.trip_id')
      .select([
        this.db.fn.sum<number>('te.passengers_in').as('total_passengers'),
        this.db.fn.avg<number>('te.passengers_in').as('avg_passengers_per_stop'),
      ])
      .where('t.scheduled_at', '>=', from)
      .where('t.scheduled_at', '<=', to)
      .where('te.event_type', '=', 'arrived')
      .executeTakeFirst();

    const incidentCount = await this.db
      .selectFrom('incidents')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('created_at', '>=', from)
      .where('created_at', '<=', to)
      .executeTakeFirst();

    const tripsByDriver = await this.db
      .selectFrom('trips as t')
      .leftJoin('drivers as d', 'd.id', 't.driver_id')
      .select([
        't.driver_id',
        'd.driver_number',
        'd.full_name',
        this.db.fn.count<number>('t.id').as('trips_count'),
        this.db.fn.sum<number>('t.amount').as('revenue'),
      ])
      .where('t.scheduled_at', '>=', from)
      .where('t.scheduled_at', '<=', to)
      .where('t.status', '=', 'completed')
      .groupBy(['t.driver_id', 'd.driver_number', 'd.full_name'])
      .orderBy('trips_count', 'desc')
      .limit(10)
      .execute();

    return {
      period: { from, to },
      summary: {
        total_trips: Number(totalStats?.total_trips ?? 0),
        completed_trips: Number(totalStats?.completed_trips ?? 0),
        total_revenue: parseFloat(String(totalStats?.total_revenue ?? 0)).toFixed(2),
        avg_revenue_per_trip: parseFloat(String(totalStats?.avg_revenue_per_trip ?? 0)).toFixed(2),
        total_passengers: Number(passengerStats?.total_passengers ?? 0),
        incidents: Number(incidentCount?.count ?? 0),
      },
      by_driver: tripsByDriver,
    };
  }
}
