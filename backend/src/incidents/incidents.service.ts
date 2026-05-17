import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { StorageService } from '../common/storage.service';
import { NotificationsService } from '../common/notifications.service';
import { CreateIncidentDto } from './incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(driverId: string, dto: CreateIncidentDto, audioFile?: Express.Multer.File) {
    let audioS3Key: string | null = null;

    if (audioFile) {
      const key = `incidents/${driverId}/${Date.now()}.aac`;
      await this.storage.upload(key, audioFile.buffer, audioFile.mimetype);
      audioS3Key = key;
    }

    const [incident] = await this.db
      .insertInto('incidents')
      .values({
        trip_id: dto.trip_id ?? null,
        driver_id: driverId,
        types: dto.types,
        audio_s3_key: audioS3Key,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        notes: dto.notes ?? null,
      })
      .returning(['id', 'trip_id', 'types', 'created_at'])
      .execute();

    const driver = await this.db.selectFrom('drivers').select(['fcm_token', 'driver_number']).where('id', '=', driverId).executeTakeFirst();
    if (driver?.fcm_token) {
      await this.notifications.sendToDevice(driver.fcm_token, 'Incident enregistré', `Votre signalement (${dto.types}) a bien été reçu.`);
    }

    // ── Audit trail ───────────────────────────────────────────────────────────
    // Log the incident to planning_audit so it appears in the audit log
    try {
      await this.db.insertInto('planning_audit').values({
        trip_id:      dto.trip_id ?? null,
        action:       'incident_reported',
        performed_by: null, // driver (not a web_user)
        before_val:   null,
        after_val:    JSON.stringify({
          incident_id:    incident.id,
          types:          dto.types,
          notes:          dto.notes ?? null,
          driver_id:      driverId,
          driver_number:  driver?.driver_number ?? null,
        }),
      }).execute();
    } catch (err: any) {
      console.warn('[incidents] audit write failed (non-fatal):', err?.message);
    }

    return incident;
  }

  async resolve(incidentId: string, resolvedBy: string) {
    const incident = await this.db
      .selectFrom('incidents')
      .select(['id', 'trip_id', 'resolved_at'])
      .where('id', '=', incidentId)
      .executeTakeFirst();

    if (!incident) throw new NotFoundException('Incident introuvable');
    if (incident.resolved_at) throw new ForbiddenException('Incident déjà résolu');

    await this.db
      .updateTable('incidents')
      .set({ resolved_at: new Date(), resolved_by: resolvedBy })
      .where('id', '=', incidentId)
      .execute();

    // Log resolution to planning_audit
    try {
      await this.db.insertInto('planning_audit').values({
        trip_id:      incident.trip_id ?? null,
        action:       'incident_resolved',
        performed_by: resolvedBy,
        before_val:   JSON.stringify({ incident_id: incidentId, resolved_at: null }),
        after_val:    JSON.stringify({ incident_id: incidentId, resolved_at: new Date().toISOString() }),
      }).execute();
    } catch (err: any) {
      console.warn('[incidents] audit resolve failed (non-fatal):', err?.message);
    }

    return { ok: true, incident_id: incidentId };
  }

  async findAll(filters: { driverId?: string; tripId?: string; from?: string; to?: string }) {
    let q = this.db
      .selectFrom('incidents as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .leftJoin('trips as t', 't.id', 'i.trip_id')
      .select([
        'i.id', 'i.types', 'i.lat', 'i.lng', 'i.notes', 'i.created_at',
        'i.resolved_at',
        'd.driver_number', 'd.full_name as driver_name',
        't.scheduled_at',
        sql<boolean>`(i.audio_s3_key is not null)`.as('has_audio'),
      ]);

    if (filters.driverId) q = q.where('i.driver_id', '=', filters.driverId);
    if (filters.tripId) q = q.where('i.trip_id', '=', filters.tripId);
    if (filters.from) q = q.where('i.created_at', '>=', new Date(filters.from));
    if (filters.to) q = q.where('i.created_at', '<=', new Date(filters.to));

    return q.orderBy('i.created_at', 'desc').execute();
  }

  async getSignedAudioUrl(incidentId: string, accessedBy: string) {
    const incident = await this.db
      .selectFrom('incidents')
      .select(['id', 'audio_s3_key'])
      .where('id', '=', incidentId)
      .executeTakeFirst();

    if (!incident) throw new NotFoundException('Incident introuvable');
    if (!incident.audio_s3_key) return { url: null };

    await this.db.insertInto('audio_access_logs').values({
      incident_id: incidentId,
      accessed_by: accessedBy,
    }).execute();

    const url = await this.storage.getSignedUrl(incident.audio_s3_key, 15 * 60);
    return { url };
  }
}
