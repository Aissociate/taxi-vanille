import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { CreateClientDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  findAll() {
    return this.db.selectFrom('clients').selectAll().where('active', '=', true).orderBy('name').execute();
  }

  async findOne(id: string) {
    const client = await this.db.selectFrom('clients').selectAll().where('id', '=', id).executeTakeFirst();
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async create(dto: CreateClientDto) {
    const [client] = await this.db.insertInto('clients').values(dto as any).returning(['id', 'name']).execute();
    return client;
  }

  async update(id: string, dto: CreateClientDto) {
    const [client] = await this.db.updateTable('clients').set(dto as any).where('id', '=', id).returning(['id', 'name']).execute();
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

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

    if (from) q = q.where('t.scheduled_at', '>=', new Date(from));
    if (to) q = q.where('t.scheduled_at', '<=', new Date(to));

    const stats = await q.executeTakeFirst();
    const incidents = await this.db
      .selectFrom('incidents as i')
      .innerJoin('trips as t', 't.id', 'i.trip_id')
      .select(this.db.fn.count('i.id').as('count'))
      .where('t.client_id', '=', clientId)
      .executeTakeFirst();

    return { ...stats, incidents: Number((incidents as any)?.count ?? 0) };
  }
}
