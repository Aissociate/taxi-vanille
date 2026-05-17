import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DB_TOKEN } from '../database/database.module';
import { Kysely } from 'kysely';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async driverLogin(driverNumber: string, pin: string) {
    const driver = await this.db
      .selectFrom('drivers')
      .selectAll()
      .where('driver_number', '=', driverNumber)
      .where('active', '=', true)
      .executeTakeFirst();

    if (!driver || !(await bcrypt.compare(pin, driver.pin_hash))) {
      throw new UnauthorizedException('Numéro ou PIN incorrect');
    }

    const tokens = await this.issueTokens({ sub: driver.id, type: 'driver', role: 'driver' });
    await this.audit.log({
      entityType: 'auth', entityId: driver.id,
      action: 'driver_login',
      after: { driver_number: driverNumber, type: 'driver' },
    });
    return tokens;
  }

  async webLogin(email: string, password: string) {
    const user = await this.db
      .selectFrom('web_users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .where('active', '=', true)
      .executeTakeFirst();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.issueTokens({ sub: user.id, type: 'web', role: user.role });
    await this.audit.log({
      entityType: 'auth', entityId: user.id,
      action: 'web_login',
      performedBy: user.id,
      after: { email: user.email, role: user.role },
    });
    return tokens;
  }

  async refreshToken(token: string) {
    const hash = createHash('sha256').update(token).digest('hex');
    const stored = await this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', hash)
      .where('revoked', '=', false)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    if (!stored) throw new UnauthorizedException('Token invalide ou expiré');

    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('id', '=', stored.id)
      .execute();

    let payload: any;
    if (stored.user_type === 'driver') {
      const driver = await this.db
        .selectFrom('drivers')
        .select(['id'])
        .where('id', '=', stored.user_id)
        .executeTakeFirst();
      payload = { sub: driver.id, type: 'driver', role: 'driver' };
    } else {
      const user = await this.db
        .selectFrom('web_users')
        .select(['id', 'role'])
        .where('id', '=', stored.user_id)
        .executeTakeFirst();
      payload = { sub: user.id, type: 'web', role: user.role };
    }

    return this.issueTokens(payload);
  }

  async revokeToken(token: string) {
    const hash = createHash('sha256').update(token).digest('hex');
    const stored = await this.db
      .selectFrom('refresh_tokens')
      .select(['user_id', 'user_type'])
      .where('token_hash', '=', hash)
      .executeTakeFirst();
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('token_hash', '=', hash)
      .execute();
    if (stored) {
      await this.audit.log({
        entityType: 'auth', entityId: stored.user_id,
        action: 'logout',
        after: { user_type: stored.user_type },
      });
    }
  }

  // ── Gestion utilisateurs web ──────────────────────────────────────────────

  async listUsers() {
    return this.db
      .selectFrom('web_users')
      .select(['id', 'email', 'full_name', 'role', 'active', 'created_at'])
      .orderBy('created_at', 'asc')
      .execute();
  }

  async createUser(dto: { email: string; full_name: string; role: string; password: string }, performedBy?: string) {
    const hash = await bcrypt.hash(dto.password, 10);
    const [user] = await this.db
      .insertInto('web_users')
      .values({
        email:         dto.email.toLowerCase().trim(),
        full_name:     dto.full_name.trim(),
        role:          dto.role as any,
        password_hash: hash,
        active:        true,
      })
      .returning(['id', 'email', 'full_name', 'role', 'active', 'created_at'])
      .execute();
    await this.audit.log({ entityType: 'auth', entityId: user.id, action: 'user_created', performedBy, after: { email: user.email, role: user.role } });
    return user;
  }

  async updateUser(id: string, dto: { email?: string; full_name?: string; role?: string; active?: boolean }, performedBy?: string) {
    const before = await this.db.selectFrom('web_users').select(['email', 'full_name', 'role', 'active']).where('id', '=', id).executeTakeFirst();
    const updates: any = { updated_at: new Date() };
    if (dto.email     != null) updates.email     = dto.email.toLowerCase().trim();
    if (dto.full_name != null) updates.full_name = dto.full_name.trim();
    if (dto.role      != null) updates.role      = dto.role;
    if (dto.active    != null) updates.active    = dto.active;
    const [user] = await this.db.updateTable('web_users').set(updates).where('id', '=', id).returning(['id', 'email', 'full_name', 'role', 'active']).execute();
    await this.audit.log({ entityType: 'auth', entityId: id, action: 'user_updated', performedBy, before, after: updates });
    return user;
  }

  async changePassword(id: string, password: string, performedBy?: string) {
    const hash = await bcrypt.hash(password, 10);
    await this.db.updateTable('web_users').set({ password_hash: hash, updated_at: new Date() }).where('id', '=', id).execute();
    await this.audit.log({ entityType: 'auth', entityId: id, action: 'user_password_changed', performedBy });
    return { ok: true };
  }

  async deleteUser(id: string, performedBy?: string) {
    // Sécurité : ne pas supprimer le dernier admin direction actif
    const user = await this.db.selectFrom('web_users').select(['email', 'role']).where('id', '=', id).executeTakeFirst();
    if (user?.role === 'direction') {
      const dirCount = await this.db.selectFrom('web_users').select(this.db.fn.count<number>('id').as('c')).where('role', '=', 'direction').where('active', '=', true).executeTakeFirst();
      if (Number((dirCount as any)?.c ?? 0) <= 1) throw new Error('Impossible de supprimer le dernier compte direction');
    }
    // Nullifier les références FK dans planning_audit avant suppression
    try {
      await this.db.updateTable('planning_audit' as any)
        .set({ performed_by: null } as any)
        .where('performed_by' as any, '=', id)
        .execute();
    } catch { /* non-bloquant */ }
    await this.db.deleteFrom('web_users').where('id', '=', id).execute();
    await this.audit.log({ entityType: 'auth', entityId: id, action: 'user_deleted', performedBy, before: user });
    return { ok: true };
  }

  private async issueTokens(payload: { sub: string; type: string; role?: string } & Record<string, any>) {
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshRaw = randomBytes(40).toString('hex');
    const refreshHash = createHash('sha256').update(refreshRaw).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.db
      .insertInto('refresh_tokens')
      .values({
        user_id: (payload as any).sub,
        user_type: (payload as any).type,
        token_hash: refreshHash,
        expires_at: expiresAt,
      })
      .execute();

    return { access_token: accessToken, refresh_token: refreshRaw, token_type: 'Bearer' };
  }
}
