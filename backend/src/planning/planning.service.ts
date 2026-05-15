import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { NotificationsService } from '../common/notifications.service';
import { CreateTripDto, UpdateTripDto } from './planning.dto';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class PlanningService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(filters: { date?: string; driverId?: string; clientId?: string; status?: string }) {
    let q = this.db
      .selectFrom('trips')
      .leftJoin('drivers', 'drivers.id', 'trips.driver_id')
      .leftJoin('clients', 'clients.id', 'trips.client_id')
      .select([
        'trips.id', 'trips.scheduled_at', 'trips.estimated_arrival_at', 'trips.status', 'trips.stops_order',
        'trips.amount', 'trips.notes', 'trips.passenger_count', 'trips.is_unplanned', 'trips.direction',
        'drivers.id as driver_id', 'drivers.driver_number', 'drivers.full_name as driver_name',
        'clients.id as client_id', 'clients.name as client_name',
      ]);

    if (filters.date) {
      const d = new Date(filters.date);
      q = q.where('trips.scheduled_at', '>=', startOfDay(d)).where('trips.scheduled_at', '<=', endOfDay(d));
    }
    if (filters.driverId) q = q.where('trips.driver_id', '=', filters.driverId);
    if (filters.clientId) q = q.where('trips.client_id', '=', filters.clientId);
    if (filters.status) q = q.where('trips.status', '=', filters.status as any);

    return q.orderBy('trips.scheduled_at').execute();
  }

  async findOne(id: string) {
    const trip = await this.db
      .selectFrom('trips')
      .leftJoin('drivers', 'drivers.id', 'trips.driver_id')
      .leftJoin('clients', 'clients.id', 'trips.client_id')
      .selectAll()
      .where('trips.id', '=', id)
      .executeTakeFirst();
    if (!trip) throw new NotFoundException('Trajet introuvable');
    return trip;
  }

  async create(dto: CreateTripDto, createdBy: string) {
    const [trip] = await this.db
      .insertInto('trips')
      .values({
        driver_id:            dto.driver_id,
        client_id:            dto.client_id,
        scheduled_at:         new Date(dto.scheduled_at),
        estimated_arrival_at: dto.estimated_arrival_at ? new Date(dto.estimated_arrival_at) : undefined,
        stops_order:          JSON.stringify(dto.stops_order ?? []),
        amount:               dto.amount,
        notes:                dto.notes,
        passenger_count:      dto.passenger_count,
        is_unplanned:         dto.is_unplanned ?? false,
        direction:            dto.direction as any,
        created_by:           createdBy,
      })
      .returning(['id', 'scheduled_at', 'status'])
      .execute();

    await this.audit(trip.id, 'created', createdBy, null, dto);
    try { await this.notifyDriver(dto.driver_id, `Nouveau trajet planifié le ${new Date(dto.scheduled_at).toLocaleDateString('fr-FR')}`); } catch {}
    return trip;
  }

  async update(id: string, dto: UpdateTripDto, performedBy: string) {
    const before = await this.findOne(id);
    const [trip] = await this.db
      .updateTable('trips')
      .set({ ...dto, scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined, estimated_arrival_at: dto.estimated_arrival_at ? new Date(dto.estimated_arrival_at) : undefined, stops_order: dto.stops_order ? JSON.stringify(dto.stops_order) : undefined } as any)
      .where('id', '=', id)
      .returning(['id', 'status', 'scheduled_at'])
      .execute();
    await this.audit(id, 'updated', performedBy, before, dto);
    return trip;
  }

  async replaceDriver(tripId: string, newDriverId: string, reason: string, performedBy: string) {
    const trip = await this.findOne(tripId);
    const oldDriverId = trip.driver_id;

    await this.db.updateTable('trips').set({ driver_id: newDriverId }).where('id', '=', tripId).execute();
    await this.audit(tripId, 'driver_replaced', performedBy, { driver_id: oldDriverId }, { driver_id: newDriverId, reason });

    try { await this.notifyDriver(oldDriverId, 'Vous avez été remplacé sur un trajet.'); } catch {}
    try { await this.notifyDriver(newDriverId, 'Un trajet vous a été affecté.'); } catch {}

    return { ok: true, trip_id: tripId, new_driver_id: newDriverId };
  }

  async cancelTrip(tripId: string, performedBy: string) {
    const before = await this.findOne(tripId);
    await this.db.updateTable('trips').set({ status: 'cancelled' }).where('id', '=', tripId).execute();
    await this.audit(tripId, 'cancelled', performedBy, { status: before.status }, { status: 'cancelled' });
    return { ok: true };
  }

  async getAudit(tripId?: string, limit = 50) {
    let q = this.db
      .selectFrom('planning_audit as a')
      .leftJoin('web_users as u', 'u.id', 'a.performed_by')
      .select(['a.id', 'a.trip_id', 'a.action', 'a.before_val', 'a.after_val', 'a.created_at', 'u.full_name as performed_by_name']);
    if (tripId) q = q.where('a.trip_id', '=', tripId);
    return q.orderBy('a.created_at', 'desc').limit(limit).execute();
  }

  private async audit(tripId: string, action: string, performedBy: string | null, before: any, after: any) {
    try {
      await this.db.insertInto('planning_audit').values({
        trip_id: tripId,
        action,
        performed_by: performedBy || null,
        before_val: before ? JSON.stringify(before) : null,
        after_val: after ? JSON.stringify(after) : null,
      }).execute();
    } catch (err: any) {
      console.warn('[audit] failed (non-fatal):', err?.message);
    }
  }

  private async notifyDriver(driverId: string, message: string) {
    const driver = await this.db
      .selectFrom('drivers')
      .select('fcm_token')
      .where('id', '=', driverId)
      .executeTakeFirst();
    if (driver?.fcm_token) {
      await this.notifications.sendToDevice(driver.fcm_token, 'Planning mis à jour', message);
    }
  }
}
