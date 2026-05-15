import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { NotificationsService } from '../common/notifications.service';
import { CreateDriverDto, UpdateDriverDto, CreateAdvanceDto, AddRepaymentDto, DeclareOdometerDto } from './drivers.dto';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

@Injectable()
export class DriversService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(activeOnly = true) {
    let q = this.db
      .selectFrom('drivers')
      .select(['id', 'driver_number', 'full_name', 'phone', 'active', 'invoice_period', 'created_at']);
    if (activeOnly) q = q.where('active', '=', true);
    return q.orderBy('driver_number').execute();
  }

  async findOne(id: string) {
    const driver = await this.db
      .selectFrom('drivers')
      .select(['id', 'driver_number', 'full_name', 'phone', 'address', 'tax_id', 'rate_config', 'invoice_period', 'active', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (!driver) throw new NotFoundException('Chauffeur introuvable');
    return driver;
  }

  async create(dto: CreateDriverDto) {
    const existing = await this.db
      .selectFrom('drivers')
      .select('id')
      .where('driver_number', '=', dto.driver_number)
      .executeTakeFirst();
    if (existing) throw new ConflictException('Numéro chauffeur déjà utilisé');

    const pin_hash = await bcrypt.hash(dto.pin, 12);
    const [driver] = await this.db
      .insertInto('drivers')
      .values({ ...dto, pin_hash, pin: undefined } as any)
      .returning(['id', 'driver_number', 'full_name', 'active'])
      .execute();
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto) {
    const updates: any = { ...dto };
    if (dto.pin) {
      updates.pin_hash = await bcrypt.hash(dto.pin, 12);
      delete updates.pin;
    }
    const [driver] = await this.db
      .updateTable('drivers')
      .set(updates)
      .where('id', '=', id)
      .returning(['id', 'driver_number', 'full_name'])
      .execute();
    if (!driver) throw new NotFoundException('Chauffeur introuvable');
    return driver;
  }

  async setActive(id: string, active: boolean) {
    await this.db.updateTable('drivers').set({ active }).where('id', '=', id).execute();

    if (!active) {
      await this.db
        .updateTable('trips')
        .set({ status: 'cancelled' })
        .where('driver_id', '=', id)
        .where('status', '!=', 'completed')
        .where('status', '!=', 'cancelled')
        .execute();

      const driver = await this.db.selectFrom('drivers').select('fcm_token').where('id', '=', id).executeTakeFirst();
      if (driver?.fcm_token) {
        await this.notifications.sendToDevice(driver.fcm_token, 'Compte désactivé', 'Votre compte a été désactivé. Contactez la direction.');
      }
    }

    return { id, active };
  }

  async updateFcmToken(driverId: string, token: string) {
    await this.db.updateTable('drivers').set({ fcm_token: token }).where('id', '=', driverId).execute();
    return { ok: true };
  }

  async getStats(id: string, period: string) {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = endOfDay(now);

    if (period === 'jour')    { from = startOfDay(now); }
    else if (period === 'semaine') { from = startOfWeek(now, { weekStartsOn: 1 }); }
    else if (period === 'mois')    { from = startOfMonth(now); }
    else if (period === 'annee')   { from = startOfYear(now); }
    // 'total' → no date filter

    let tripsQ = this.db
      .selectFrom('trips')
      .select([
        sql<number>`count(*) filter (where status = 'completed')`.as('completed'),
        sql<number>`coalesce(sum(amount) filter (where status = 'completed'), 0)`.as('revenue'),
      ])
      .where('driver_id', '=', id);

    if (from) tripsQ = tripsQ.where('scheduled_at', '>=', from);
    if (to)   tripsQ = tripsQ.where('scheduled_at', '<=', to);

    const [tripsRow] = await tripsQ.execute() as any[];

    // Passagers depuis trip_events
    let passQ = this.db
      .selectFrom('trip_events as te')
      .innerJoin('trips as t', 't.id', 'te.trip_id')
      .select(sql<number>`coalesce(sum(te.passengers_in), 0)`.as('total'))
      .where('t.driver_id', '=', id)
      .where('te.event_type', '=', 'arrived');

    if (from) passQ = passQ.where('t.scheduled_at', '>=', from);
    if (to)   passQ = passQ.where('t.scheduled_at', '<=', to);

    const passRow = await passQ.executeTakeFirst() as any;

    // Incidents
    let incQ = this.db
      .selectFrom('incidents')
      .select(sql<number>`count(*)`.as('count'))
      .where('driver_id', '=', id);

    if (from) incQ = incQ.where('created_at', '>=', from);
    if (to)   incQ = incQ.where('created_at', '<=', to);

    const incRow = await incQ.executeTakeFirst() as any;

    const completed   = Number(tripsRow?.completed ?? 0);
    const revenue     = parseFloat(String(tripsRow?.revenue ?? 0));
    const passagers   = Number(passRow?.total ?? 0);
    const incidents   = Number(incRow?.count ?? 0);

    return {
      courses:   completed,
      passagers,
      ca:        revenue.toFixed(2),
      incidents,
    };
  }

  // ── Acomptes ──────────────────────────────────────────────────────────────

  async findAdvances(driverId: string) {
    const advances = await this.db
      .selectFrom('driver_advances')
      .select(['id', 'amount', 'date', 'notes', 'created_at'])
      .where('driver_id', '=', driverId)
      .orderBy('date', 'desc')
      .execute();

    const repayments = advances.length
      ? await this.db
          .selectFrom('driver_advance_repayments')
          .select(['id', 'advance_id', 'amount', 'date', 'notes'])
          .where('advance_id', 'in', advances.map(a => a.id))
          .orderBy('date')
          .execute()
      : [];

    return advances.map(a => {
      const reps = repayments.filter(r => r.advance_id === a.id);
      const repaid = reps.reduce((s, r) => s + Number(r.amount), 0);
      const balance = Number(a.amount) - repaid;
      const daysOpen = Math.floor((Date.now() - new Date(a.date).getTime()) / 86400000);
      return { ...a, repayments: reps, repaid: repaid.toFixed(2), balance: balance.toFixed(2), daysOpen };
    });
  }

  async createAdvance(driverId: string, dto: CreateAdvanceDto) {
    const [row] = await this.db
      .insertInto('driver_advances')
      .values({
        driver_id: driverId,
        amount: dto.amount,
        date: dto.date ?? new Date().toISOString().slice(0, 10),
        notes: dto.notes ?? null,
      } as any)
      .returning(['id', 'amount', 'date', 'notes', 'created_at'])
      .execute();
    return { ...row, repayments: [], repaid: '0.00', balance: String(row.amount), daysOpen: 0 };
  }

  async addRepayment(advanceId: string, dto: AddRepaymentDto) {
    const [row] = await this.db
      .insertInto('driver_advance_repayments')
      .values({
        advance_id: advanceId,
        amount: dto.amount,
        date: dto.date ?? new Date().toISOString().slice(0, 10),
        notes: dto.notes ?? null,
      } as any)
      .returning(['id', 'advance_id', 'amount', 'date', 'notes'])
      .execute();
    return row;
  }

  async deleteAdvance(advanceId: string) {
    await this.db.deleteFrom('driver_advances').where('id', '=', advanceId).execute();
    return { ok: true };
  }

  async deleteRepayment(repaymentId: string) {
    await this.db.deleteFrom('driver_advance_repayments').where('id', '=', repaymentId).execute();
    return { ok: true };
  }

  // ── Kilométrages ──────────────────────────────────────────────────────────

  async findMileages(driverId: string) {
    const rows = await this.db
      .selectFrom('driver_mileages')
      .select(['id', 'month', 'km_start', 'km_end', 'declared_start_at', 'declared_end_at', 'notes', 'updated_at'])
      .where('driver_id', '=', driverId)
      .orderBy('month', 'desc')
      .execute();

    return rows.map(r => ({
      ...r,
      km_total: r.km_start != null && r.km_end != null ? r.km_end - r.km_start : null,
      status: r.km_start != null && r.km_end != null
        ? 'complet'
        : r.km_start != null ? 'en_attente_fin'
        : r.km_end != null ? 'en_attente_debut'
        : 'non_declare',
    }));
  }

  async getMileageForMonth(driverId: string, month: string) {
    const row = await this.db
      .selectFrom('driver_mileages')
      .select(['id', 'month', 'km_start', 'km_end', 'declared_start_at', 'declared_end_at', 'notes'])
      .where('driver_id', '=', driverId)
      .where('month', '=', month)
      .executeTakeFirst();
    return row ?? null;
  }

  async declareOdometer(driverId: string, dto: DeclareOdometerDto) {
    const now = new Date();
    const existing = await this.db
      .selectFrom('driver_mileages')
      .select('id')
      .where('driver_id', '=', driverId)
      .where('month', '=', dto.month)
      .executeTakeFirst();

    if (existing) {
      const updates: any = { updated_at: now };
      if (dto.type === 'start') { updates.km_start = dto.km; updates.declared_start_at = now; }
      else                      { updates.km_end   = dto.km; updates.declared_end_at   = now; }
      if (dto.notes != null) updates.notes = dto.notes;
      await this.db.updateTable('driver_mileages').set(updates).where('id', '=', existing.id).execute();
    } else {
      const insert: any = { driver_id: driverId, month: dto.month, updated_at: now };
      if (dto.type === 'start') { insert.km_start = dto.km; insert.declared_start_at = now; }
      else                      { insert.km_end   = dto.km; insert.declared_end_at   = now; }
      if (dto.notes) insert.notes = dto.notes;
      await this.db.insertInto('driver_mileages').values(insert).execute();
    }

    return this.getMileageForMonth(driverId, dto.month);
  }

  async getTodaySchedule(driverId: string) {
    const today = new Date();
    return this.db
      .selectFrom('trips')
      .leftJoin('clients', 'clients.id', 'trips.client_id')
      .select([
        'trips.id',
        'trips.scheduled_at',
        'trips.status',
        'trips.stops_order',
        'trips.amount',
        'trips.notes',
        'clients.name as client_name',
      ])
      .where('trips.driver_id', '=', driverId)
      .where('trips.scheduled_at', '>=', startOfDay(today))
      .where('trips.scheduled_at', '<=', endOfDay(today))
      .where('trips.status', '!=', 'cancelled')
      .orderBy('trips.scheduled_at')
      .execute();
  }
}
