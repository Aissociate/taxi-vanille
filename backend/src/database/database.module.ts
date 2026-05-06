import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

export const DB_TOKEN = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useFactory: () => {
        const dialect = new PostgresDialect({
          pool: new Pool({ connectionString: process.env.DATABASE_URL }),
        });
        return new Kysely({ dialect });
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
