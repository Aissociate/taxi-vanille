import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';

export interface AuditParams {
  entityType: string;        // 'trip' | 'driver' | 'client' | 'invoice' | 'setting' | 'auth' | 'incident'
  entityId?:  string;        // UUID or slug of the mutated entity
  tripId?:    string;        // kept for backward-compat with planning_audit FK
  action:     string;        // e.g. 'created', 'updated', 'driver_deactivated', 'login', 'settings_updated'
  performedBy?: string;      // web_user UUID (nullable for driver-app or system actions)
  before?: any;
  after?:  any;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DB_TOKEN) private readonly db: Kysely<any>) {}

  async log(p: AuditParams): Promise<void> {
    try {
      await this.db.insertInto('planning_audit').values({
        trip_id:      p.tripId    ?? null,
        entity_type:  p.entityType,
        entity_id:    p.entityId  ?? p.tripId ?? null,
        action:       p.action,
        performed_by: p.performedBy ?? null,
        before_val:   p.before ? JSON.stringify(p.before) : null,
        after_val:    p.after  ? JSON.stringify(p.after)  : null,
      }).execute();
    } catch (err: any) {
      console.warn(`[audit] ${p.entityType}/${p.action} failed (non-fatal):`, err?.message);
    }
  }
}
