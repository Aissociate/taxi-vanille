import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';

@Injectable()
export class SettingsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.db.selectFrom('settings').select(['section', 'data']).execute();
    return Object.fromEntries(rows.map((r: any) => [r.section, r.data]));
  }

  async getSection(section: string): Promise<unknown> {
    const row = await this.db
      .selectFrom('settings')
      .select('data')
      .where('section', '=', section)
      .executeTakeFirst();
    return (row as any)?.data ?? null;
  }

  async upsert(section: string, data: unknown): Promise<{ section: string; data: unknown }> {
    await this.db
      .insertInto('settings')
      .values({ section, data: data as any, updated_at: new Date() } as any)
      .onConflict(oc => oc.column('section').doUpdateSet({
        data: data as any,
        updated_at: new Date() as any,
      }))
      .execute();
    return { section, data };
  }
}
