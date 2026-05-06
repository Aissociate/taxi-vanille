import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DB_TOKEN } from '../database/database.module';
import { Kysely } from 'kysely';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly jwt: JwtService,
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

    return this.issueTokens({ sub: driver.id, type: 'driver', role: 'driver' });
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

    return this.issueTokens({ sub: user.id, type: 'web', role: user.role });
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
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked: true })
      .where('token_hash', '=', hash)
      .execute();
  }

  private async issueTokens(payload: object & { sub: string; type: string }) {
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
