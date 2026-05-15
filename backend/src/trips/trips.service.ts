import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { GpsGateway } from '../gps/gps.gateway';
import { NotificationsService } from '../common/notifications.service';
import { StartTripDto, StopEventDto, EndTripDto } from './trips.dto';

@Injectable()
export class TripsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly gpsGateway: GpsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async startTrip(tripId: string, driverId: string, dto: StartTripDto) {
    const trip = await this.db
      .selectFrom('trips')
      .selectAll()
      .where('id', '=', tripId)
      .where('driver_id', '=', driverId)
      .executeTakeFirst();

    if (!trip) throw new NotFoundException('Trajet introuvable');
    if (trip.status === 'in_progress') throw new BadRequestException('Course déjà démarrée');
    if (trip.status === 'completed') throw new BadRequestException('Course déjà terminée');

    await this.db.updateTable('trips').set({ status: 'in_progress' }).where('id', '=', tripId).execute();

    await this.db.insertInto('trip_events').values({
      trip_id: tripId,
      event_type: 'start',
      lat: dto.lat,
      lng: dto.lng,
      occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : new Date(),
    }).execute();

    return { ok: true, trip_id: tripId, status: 'in_progress' };
  }

  async recordStopEvent(tripId: string, stopId: string, driverId: string, dto: StopEventDto) {
    const trip = await this.db
      .selectFrom('trips')
      .select('status')
      .where('id', '=', tripId)
      .where('driver_id', '=', driverId)
      .executeTakeFirst();

    if (!trip) throw new NotFoundException('Trajet introuvable');

    await this.db.insertInto('trip_events').values({
      trip_id: tripId,
      stop_id: stopId,
      event_type: dto.event_type,
      passengers_in: dto.passengers_in ?? 0,
      passengers_out: dto.passengers_out ?? 0,
      lat: dto.lat,
      lng: dto.lng,
      occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : new Date(),
    }).execute();

    return { ok: true };
  }

  async endTrip(tripId: string, driverId: string, dto: EndTripDto) {
    await this.db.updateTable('trips').set({ status: 'completed' }).where('id', '=', tripId).where('driver_id', '=', driverId).execute();

    await this.db.insertInto('trip_events').values({
      trip_id: tripId,
      event_type: 'end',
      lat: dto.lat,
      lng: dto.lng,
      occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : new Date(),
    }).execute();

    const events = await this.getTripEvents(tripId);
    const totalPax = events.reduce((s, e) => s + (e.passengers_in ?? 0), 0);

    const driver = await this.db.selectFrom('drivers').select('fcm_token').where('id', '=', driverId).executeTakeFirst();
    if (driver?.fcm_token) {
      await this.notifications.sendToDevice(driver.fcm_token, 'Course terminée', 'Votre course a bien été enregistrée.');
    }

    return { ok: true, total_passengers: totalPax };
  }

  async getTripEvents(tripId: string) {
    return this.db
      .selectFrom('trip_events')
      .selectAll()
      .where('trip_id', '=', tripId)
      .orderBy('occurred_at')
      .execute();
  }

  async batchSync(driverId: string, events: any[]) {
    const results = [];
    for (const ev of events) {
      try {
        if (ev.type === 'start') {
          await this.startTrip(ev.trip_id, driverId, ev);
        } else if (ev.type === 'stop_event') {
          await this.recordStopEvent(ev.trip_id, ev.stop_id, driverId, ev);
        } else if (ev.type === 'end') {
          await this.endTrip(ev.trip_id, driverId, ev);
        }
        results.push({ id: ev.local_id, ok: true });
      } catch (e) {
        results.push({ id: ev.local_id, ok: false, error: e.message });
      }
    }
    return { synced: results };
  }
}
