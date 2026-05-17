import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const FORBIDDEN_SECRET_VALUES = [
  'change_me_in_production_min32chars',
  'change_refresh_secret_min32chars',
  'changeme',
];

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  for (const key of required) {
    const v = process.env[key];
    if (!v) throw new Error(`[boot] ${key} is required in production`);
    if (FORBIDDEN_SECRET_VALUES.some((bad) => v.includes(bad))) {
      throw new Error(`[boot] ${key} uses an example/default value — generate a real secret (openssl rand -hex 32)`);
    }
  }
  if ((process.env.JWT_SECRET ?? '').length < 32 || (process.env.JWT_REFRESH_SECRET ?? '').length < 32) {
    throw new Error('[boot] JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 chars');
  }
}

async function bootstrap() {
  assertProductionSecrets();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Taxi Vanille API running on port ${port}`);
}
bootstrap();
