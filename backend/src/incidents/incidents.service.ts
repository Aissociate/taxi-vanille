import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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

    const driver = await this.db.selectFrom('drivers').select('fcm_token').where('id', '=', driverId).executeTakeFirst();
    if (driver?.fcm_token) {
      await this.notifications.sendToDevice(driver.fcm_token, 'Incident enregistré', `Votre signalement (${dto.types}) a bien été reçu.`);
    }

    return incident;
  }

  async findAll(filters: { driverId?: string; tripId?: string; from?: string; to?: string }) {
    let q = this.db
      .selectFrom('incidents as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .leftJoin('trips as t', 't.id', 'i.trip_id')
      .select([
        'i.id', 'i.types', 'i.lat', 'i.lng', 'i.notes', 'i.created_at',
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
