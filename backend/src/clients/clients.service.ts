import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { AuditService } from '../common/audit.service';
import { CreateClientDto, SaveReportDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly audit: AuditService,
  ) {}

  // ── Clients ─────────────────────────────────────────────────────────────────

  findAll() {
    return this.db
      .selectFrom('clients')
      .selectAll()
      .where('active', '=', true)
      .orderBy('name')
      .execute();
  }

  async findOne(id: string) {
    const client = await this.db
      .selectFrom('clients')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async create(dto: CreateClientDto, performedBy?: string) {
    const [client] = await this.db
      .insertInto('clients')
      .values(dto as any)
      .returning(['id', 'name'])
      .execute();
    await this.audit.log({
      entityType: 'client', entityId: client.id,
      action: 'client_created',
      performedBy,
      after: { name: client.name },
    });
    return client;
  }

  async update(id: string, dto: CreateClientDto, performedBy?: string) {
    const before = await this.findOne(id).catch(() => null);
    const [client] = await this.db
      .updateTable('clients')
      .set(dto as any)
      .where('id', '=', id)
      .returning(['id', 'name'])
      .execute();
    if (!client) throw new NotFoundException('Client introuvable');
    await this.audit.log({
      entityType: 'client', entityId: id,
      action: 'client_updated',
      performedBy,
      before: before ? { name: (before as any).name } : null,
      after:  { name: client.name, ...dto },
    });
    return client;
  }

  // ── Rapport agrégé (ancien endpoint) ────────────────────────────────────────

  async getReport(clientId: string, from?: string, to?: string) {
    let q = this.db
      .selectFrom('trips as t')
      .leftJoin('trip_events as te', 'te.trip_id', 't.id')
      .select([
        this.db.fn.count('t.id').distinct().as('total_trips'),
        this.db.fn.sum('te.passengers_in').as('total_passengers'),
        this.db.fn.sum('t.amount').as('total_revenue'),
      ])
      .where('t.client_id', '=', clientId)
      .where('t.status', '=', 'completed');

    if (from) q = q.where('t.scheduled_at', '>=', new Date(from) as any);
    if (to)   q = q.where('t.scheduled_at', '<=', new Date(to)   as any);

    const stats = await q.executeTakeFirst();
    const incidents = await this.db
      .selectFrom('incidents as i')
      .innerJoin('trips as t', 't.id', 'i.trip_id')
      .select(this.db.fn.count('i.id').as('count'))
      .where('t.client_id', '=', clientId)
      .executeTakeFirst();

    return { ...stats, incidents: Number((incidents as any)?.count ?? 0) };
  }

  // ── Lignes / routes par client ───────────────────────────────────────────────

  getClientLines() {
    return this.db
      .selectFrom('client_lines as cl')
      .innerJoin('clients as c', 'c.id', 'cl.client_id')
      .select([
        'cl.id',
        'cl.client_id',
        'cl.code',
        'cl.name',
        'cl.badge',
        'cl.color',
        'cl.vehicle_capacity',
        'cl.dir_matin_a',
        'cl.dir_matin_r',
        'cl.dir_am_a',
        'cl.dir_am_r',
        'cl.taux_matin_a',
        'cl.taux_matin_r',
        'cl.taux_am_a',
        'cl.taux_am_r',
        'cl.sort_order',
        'c.name as client_name',
      ])
      .where('cl.active', '=', true)
      .where('c.active', '=', true)
      .orderBy('c.name')
      .orderBy('cl.sort_order')
      .execute();
  }

  async createLine(clientId: string, dto: {
    code: string; name: string; badge?: string; color?: string;
    vehicle_capacity?: number; dir_matin_a?: string; dir_matin_r?: string;
    dir_am_a?: string; dir_am_r?: string;
  }) {
    const [line] = await this.db
      .insertInto('client_lines')
      .values({
        client_id:        clientId,
        code:             dto.code,
        name:             dto.name,
        badge:            dto.badge ?? dto.code.substring(0, 6),
        color:            dto.color ?? '#7c3aed',
        vehicle_capacity: dto.vehicle_capacity ?? 55,
        dir_matin_a:      dto.dir_matin_a ?? '',
        dir_matin_r:      dto.dir_matin_r ?? '',
        dir_am_a:         dto.dir_am_a ?? '',
        dir_am_r:         dto.dir_am_r ?? '',
        active:           true,
        sort_order:       0,
      })
      .returning(['id', 'code', 'name', 'badge', 'client_id'])
      .execute();
    return line;
  }

  // ── Stats journalières (client_daily_stats) ──────────────────────────────────

  getDailyStats(clientId: string, from?: string, to?: string, lineId?: string) {
    let q = this.db
      .selectFrom('client_daily_stats as s')
      .select([
        's.id',
        's.date',
        's.line_id',
        's.usagers',
        's.usagers_matin',
        's.usagers_am',
        's.taux',
        's.taux_matin',
        's.taux_am',
        's.incidents_count',
        's.retards_count',
        's.unplanned_trips',
        's.is_manual',
        's.notes',
      ])
      .where('s.client_id', '=', clientId);

    if (lineId) q = q.where('s.line_id', '=', lineId);
    if (from)   q = q.where('s.date', '>=', from as any);
    if (to)     q = q.where('s.date', '<=', to   as any);

    return q.orderBy('s.date').execute();
  }

  // ── Stats par direction (v_direction_stats) ──────────────────────────────────
  // Retourne un objet { matin_aller: {...}, matin_retour: {...}, am_aller: {...}, am_retour: {...} }

  async getDirectionStats(clientId: string, from?: string, to?: string, lineId?: string) {
    let q = this.db
      .selectFrom('v_direction_stats as ds')
      .innerJoin('client_lines as cl', 'cl.id', 'ds.line_id')
      .select([
        'ds.direction',
        this.db.fn.avg('ds.avg_duration_min').as('duration_min_avg'),
        this.db.fn.avg('ds.avg_pax_per_trip').as('avg_pax_avg'),
        this.db.fn.avg('ds.nb_drivers').as('nb_vehicles_avg'),
        this.db.fn.avg('ds.nb_trips').as('nb_trips_avg'),
        this.db.fn.max('cl.vehicle_capacity').as('vehicle_seats'),
      ])
      .where('ds.client_id', '=', clientId);

    if (lineId) q = q.where('ds.line_id', '=', lineId);
    if (from)   q = q.where('ds.trip_date', '>=', from as any);
    if (to)     q = q.where('ds.trip_date', '<=', to   as any);

    const rows = await q.groupBy('ds.direction').execute();

    // Pivot en objet keyed par direction
    return Object.fromEntries(
      rows.map(r => [
        r.direction,
        {
          duration_min:  Math.round(Number(r.duration_min_avg)  || 0),
          avg_pax:       Math.round(Number(r.avg_pax_avg)       || 0),
          nb_vehicles:   Math.round(Number(r.nb_vehicles_avg)   || 0),
          vehicle_seats: Number(r.vehicle_seats)                 || 55,
          nb_trips_day:  Math.round(Number(r.nb_trips_avg)      || 1),
        },
      ]),
    );
  }

  // ── Archive rapports (client_reports) ────────────────────────────────────────

  listReports(clientId?: string) {
    let q = this.db
      .selectFrom('client_reports as r')
      .innerJoin('clients as c', 'c.id', 'r.client_id')
      .leftJoin('client_lines as cl', 'cl.id', 'r.line_id')
      .select([
        'r.id',
        'r.client_id',
        'r.line_id',
        'r.period_start',
        'r.period_end',
        'r.month',
        'r.title',
        'r.total_usagers',
        'r.avg_taux',
        'r.jours_service',
        'r.total_incidents',
        'r.total_retards',
        'r.total_unplanned',
        'r.comment',
        'r.created_at',
        'c.name as client_name',
        'cl.name as line_name',
        'cl.badge',
        'cl.color',
      ]);

    if (clientId) q = q.where('r.client_id', '=', clientId);

    return q.orderBy('r.created_at', 'desc').execute();
  }

  async saveReport(clientId: string, dto: SaveReportDto, userId?: string) {
    const [report] = await this.db
      .insertInto('client_reports')
      .values({
        client_id:       clientId,
        line_id:         dto.line_id    ?? null,
        period_start:    dto.period_start as any,
        period_end:      dto.period_end   as any,
        title:           dto.title        ?? null,
        total_usagers:   dto.total_usagers   ?? null,
        avg_taux:        dto.avg_taux         ?? null,
        jours_service:   dto.jours_service    ?? null,
        total_incidents: dto.total_incidents  ?? null,
        total_retards:   dto.total_retards    ?? null,
        total_unplanned: dto.total_unplanned  ?? null,
        comment:         dto.comment          ?? null,
        snapshot:        dto.snapshot ? JSON.stringify(dto.snapshot) : null,
        generated_by:    userId ?? null,
      } as any)
      .returning(['id', 'created_at', 'month'])
      .execute();
    return report;
  }

  async deleteReport(reportId: string) {
    await this.db
      .deleteFrom('client_reports')
      .where('id', '=', reportId)
      .execute();
    return { ok: true };
  }
}
