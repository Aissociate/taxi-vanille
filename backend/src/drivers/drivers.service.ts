import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { CreateDriverDto, UpdateDriverDto } from './drivers.dto';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class DriversService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

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
    return { id, active };
  }

  async updateFcmToken(driverId: string, token: string) {
    await this.db.updateTable('drivers').set({ fcm_token: token }).where('id', '=', driverId).execute();
    return { ok: true };
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
