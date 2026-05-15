import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, differenceInDays } from 'date-fns';

const BUS_CAPACITY = 24; // sièges midi-bus standard

@Injectable()
export class KpiService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  async getDashboard(filters: { from?: string; to?: string; driverId?: string; clientId?: string }) {
    const to   = filters.to   ? endOfDay(new Date(filters.to))   : endOfDay(new Date());
    const from = filters.from ? startOfDay(new Date(filters.from)) : startOfDay(subDays(to, 6));

    const spanDays = Math.max(1, differenceInDays(to, from) + 1);
    const prevTo   = new Date(from.getTime() - 1);
    const prevFrom = startOfDay(new Date(prevTo.getTime() - spanDays * 24 * 3600 * 1000 + 1));

    // ── Résumé période ────────────────────────────────────────────────────────

    const [totalStats] = await this.db
      .selectFrom('trips')
      .select([
        this.db.fn.count<number>('id').as('total_trips'),
        sql<number>`count(*) filter (where status = 'completed')`.as('completed_trips'),
        sql<number>`count(*) filter (where status not in ('completed','pending','scheduled'))`.as('missed_trips'),
        sql<number>`count(*) filter (where status = 'delayed' or (notes ilike '%retard%'))`.as('delayed_trips'),
        sql<number>`sum(amount) filter (where status = 'completed')`.as('total_revenue'),
        sql<number>`avg(amount) filter (where status = 'completed')`.as('avg_revenue_per_trip'),
      ])
      .where('scheduled_at', '>=', from)
      .where('scheduled_at', '<=', to)
      .$if(!!filters.driverId, q => q.where('driver_id', '=', filters.driverId!))
      .$if(!!filters.clientId, q => q.where('client_id', '=', filters.clientId!))
      .execute();

    // ── Période précédente (pour deltas) ─────────────────────────────────────

    const [prevStats] = await this.db
      .selectFrom('trips')
      .select([
        sql<number>`count(*) filter (where status = 'completed')`.as('completed_trips'),
        sql<number>`sum(amount) filter (where status = 'completed')`.as('total_revenue'),
      ])
      .where('scheduled_at', '>=', prevFrom)
      .where('scheduled_at', '<=', prevTo)
      .execute();

    // ── Voyageurs ─────────────────────────────────────────────────────────────

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

    // ── Durée moyenne des trajets (depuis les events) ─────────────────────────

    let avgDurationMin = 0;
    try {
      const durResult = await this.db
        .selectFrom('trip_events as te1')
        .innerJoin('trip_events as te2', 'te2.trip_id', 'te1.trip_id')
        .innerJoin('trips as t', 't.id', 'te1.trip_id')
        .select(
          sql<number>`avg(extract(epoch from (te2.created_at - te1.created_at)) / 60)`.as('avg_min')
        )
        .where('te1.event_type', '=', 'started')
        .where('te2.event_type', '=', 'arrived')
        .where('t.scheduled_at', '>=', from)
        .where('t.scheduled_at', '<=', to)
        .executeTakeFirst() as any;
      avgDurationMin = Math.round(Number(durResult?.avg_min ?? 0));
    } catch { avgDurationMin = 0; }

    // ── Incidents ─────────────────────────────────────────────────────────────

    const incidentCount = await this.db
      .selectFrom('incidents')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('created_at', '>=', from)
      .where('created_at', '<=', to)
      .executeTakeFirst();

    const lastIncident = await this.db
      .selectFrom('incidents as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .select(['i.description', 'd.driver_number', 'd.full_name'])
      .where('i.created_at', '>=', from)
      .orderBy('i.created_at', 'desc')
      .limit(1)
      .executeTakeFirst() as any;

    // ── Sparkline (journalier) ────────────────────────────────────────────────

    const dailyRows = await this.db
      .selectFrom('trips')
      .select([
        sql<string>`date_trunc('day', scheduled_at)::date`.as('day'),
        sql<number>`count(*) filter (where status = 'completed')`.as('trips'),
        sql<number>`coalesce(sum(amount) filter (where status = 'completed'), 0)`.as('revenue'),
      ])
      .where('scheduled_at', '>=', from)
      .where('scheduled_at', '<=', to)
      .groupBy(sql`date_trunc('day', scheduled_at)`)
      .orderBy('day')
      .execute() as any[];

    // ── Trajets non effectués par cause ───────────────────────────────────────

    const missedRows = await this.db
      .selectFrom('trips')
      .select(['notes'])
      .where('scheduled_at', '>=', from)
      .where('scheduled_at', '<=', to)
      .where('status', 'not in', ['completed', 'pending', 'scheduled'])
      .execute() as any[];

    const causeCounts: Record<string, number> = {
      'Voiture en panne': 0,
      'Absence chauffeur': 0,
      'Météo / route bloquée': 0,
      'Autre': 0,
    };
    for (const { notes } of missedRows) {
      const n = (notes ?? '').toLowerCase();
      if (n.includes('panne') || n.includes('vehicule') || n.includes('moteur')) {
        causeCounts['Voiture en panne']++;
      } else if (n.includes('absent') || n.includes('absence') || n.includes('chauffeur')) {
        causeCounts['Absence chauffeur']++;
      } else if (n.includes('météo') || n.includes('meteo') || n.includes('route') || n.includes('bloquée') || n.includes('bloque')) {
        causeCounts['Météo / route bloquée']++;
      } else {
        causeCounts['Autre']++;
      }
    }
    const missedByCause = Object.entries(causeCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);

    // ── Par chauffeur ─────────────────────────────────────────────────────────

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
      .$if(!!filters.driverId, q => q.where('t.driver_id', '=', filters.driverId!))
      .groupBy(['t.driver_id', 'd.driver_number', 'd.full_name'])
      .orderBy('trips_count', 'desc')
      .limit(15)
      .execute();

    // ── Calculs dérivés ───────────────────────────────────────────────────────

    const totalTrips     = Number(totalStats?.total_trips     ?? 0);
    const completed      = Number(totalStats?.completed_trips  ?? 0);
    const missed         = Number(totalStats?.missed_trips     ?? 0);
    const delayed        = Number(totalStats?.delayed_trips    ?? 0);
    const totalRevenue   = parseFloat(String(totalStats?.total_revenue ?? 0));
    const avgRevPerTrip  = parseFloat(String(totalStats?.avg_revenue_per_trip ?? 0));
    const totalPass      = Number(passengerStats?.total_passengers ?? 0);
    const prevRevenue    = parseFloat(String(prevStats?.total_revenue ?? 0));
    const prevCompleted  = Number(prevStats?.completed_trips ?? 0);
    const incidentN      = Number(incidentCount?.count ?? 0);

    const ponctualite = totalTrips > 0 ? ((totalTrips - delayed) / totalTrips) * 100 : 100;
    const tauxFrequentation = completed > 0 ? (totalPass / (completed * BUS_CAPACITY)) * 100 : 0;
    const revenueDelta = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const completedDelta = completed - prevCompleted;
    const avgPassPerDay = spanDays > 0 ? totalPass / spanDays : 0;

    return {
      period: { from, to, span_days: spanDays },
      summary: {
        total_trips:           totalTrips,
        completed_trips:       completed,
        missed_trips:          missed,
        delayed_trips:         delayed,
        total_revenue:         totalRevenue.toFixed(2),
        avg_revenue_per_trip:  avgRevPerTrip.toFixed(2),
        total_passengers:      totalPass,
        avg_passengers_per_trip: completed > 0 ? (totalPass / completed).toFixed(1) : '0',
        avg_passengers_per_day:  avgPassPerDay.toFixed(0),
        incidents:             incidentN,
        last_incident:         lastIncident ?? null,
        ponctualite:           ponctualite.toFixed(1),
        taux_frequentation:    tauxFrequentation.toFixed(1),
        avg_trip_duration_min: avgDurationMin,
        prev_revenue:          prevRevenue.toFixed(2),
        prev_completed:        prevCompleted,
        revenue_delta_pct:     revenueDelta.toFixed(1),
        completed_delta:       completedDelta,
      },
      sparkline: dailyRows.map(r => ({
        date:    String(r.day),
        trips:   Number(r.trips),
        revenue: parseFloat(String(r.revenue)),
      })),
      missed_by_cause: missedByCause,
      by_driver: tripsByDriver,
    };
  }
}
