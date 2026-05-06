-- Taxi Vanille Mayotte — Schéma initial PostgreSQL 16
-- Migration 001 — Schéma complet

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
CREATE TYPE invoice_period_enum AS ENUM ('weekly', 'monthly');
CREATE TYPE trip_status_enum AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE event_type_enum AS ENUM ('start', 'arrived', 'departed', 'end');
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'validated', 'paid');
CREATE TYPE user_role_enum AS ENUM ('direction', 'coordinator');

-- Chauffeurs
CREATE TABLE drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_number   VARCHAR(20)  UNIQUE NOT NULL,
  pin_hash        TEXT         NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  address         TEXT,
  tax_id          VARCHAR(50),
  rate_config     JSONB        DEFAULT '{}',
  invoice_period  invoice_period_enum DEFAULT 'weekly',
  active          BOOLEAN      DEFAULT true,
  fcm_token       TEXT,
  created_at      TIMESTAMPTZ  DEFAULT now(),
  updated_at      TIMESTAMPTZ  DEFAULT now()
);

-- Utilisateurs web (direction / coordinateurs)
CREATE TABLE web_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT       NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  role        user_role_enum NOT NULL DEFAULT 'coordinator',
  active      BOOLEAN      DEFAULT true,
  created_at  TIMESTAMPTZ  DEFAULT now(),
  updated_at  TIMESTAMPTZ  DEFAULT now()
);

-- Clients institutionnels
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  address       TEXT,
  contact_name  VARCHAR(100),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(20),
  rate_config   JSONB DEFAULT '{}',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Arrêts / Points de passage
CREATE TABLE stops (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name     VARCHAR(150) NOT NULL,
  address  TEXT,
  lat      DOUBLE PRECISION,
  lng      DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trajets planifiés
CREATE TABLE trips (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID REFERENCES drivers(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  stops_order  JSONB DEFAULT '[]',
  status       trip_status_enum DEFAULT 'planned',
  amount       NUMERIC(10,2),
  notes        TEXT,
  created_by   UUID REFERENCES web_users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trips_driver_date ON trips (driver_id, scheduled_at);
CREATE INDEX idx_trips_status ON trips (status);
CREATE INDEX idx_trips_scheduled ON trips (scheduled_at);

-- Événements en cours de course
CREATE TABLE trip_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id        UUID REFERENCES stops(id),
  event_type     event_type_enum NOT NULL,
  passengers_in  INT  DEFAULT 0,
  passengers_out INT  DEFAULT 0,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  occurred_at    TIMESTAMPTZ NOT NULL,
  synced_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trip_events_trip ON trip_events (trip_id, occurred_at);

-- Incidents
CREATE TABLE incidents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID REFERENCES trips(id) ON DELETE SET NULL,
  driver_id    UUID REFERENCES drivers(id) ON DELETE SET NULL,
  types        TEXT[] DEFAULT '{}',
  audio_s3_key TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_incidents_trip ON incidents (trip_id);
CREATE INDEX idx_incidents_driver ON incidents (driver_id, created_at DESC);

-- Logs d'accès vocaux (RGPD)
CREATE TABLE audio_access_logs (
  id          BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id),
  accessed_by UUID NOT NULL REFERENCES web_users(id),
  accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Positions GPS
CREATE TABLE gps_pings (
  id          BIGSERIAL PRIMARY KEY,
  driver_id   UUID        NOT NULL REFERENCES drivers(id),
  trip_id     UUID,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  accuracy_m  REAL,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_gps_driver_time ON gps_pings (driver_id, recorded_at DESC);
CREATE INDEX idx_gps_trip ON gps_pings (trip_id, recorded_at);

-- Factures
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  driver_id      UUID NOT NULL REFERENCES drivers(id),
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  trip_ids       UUID[] DEFAULT '{}',
  amount_ht      NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_ttc     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         invoice_status_enum DEFAULT 'draft',
  pdf_s3_key     TEXT,
  validated_by   UUID REFERENCES web_users(id),
  validated_at   TIMESTAMPTZ,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_invoices_driver ON invoices (driver_id, period_start DESC);
CREATE INDEX idx_invoices_status ON invoices (status);

-- Audit planning
CREATE TABLE planning_audit (
  id           BIGSERIAL PRIMARY KEY,
  trip_id      UUID REFERENCES trips(id),
  action       VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES web_users(id),
  before_val   JSONB,
  after_val    JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_trip ON planning_audit (trip_id, created_at DESC);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID,
  user_type  VARCHAR(10) NOT NULL CHECK (user_type IN ('driver', 'web')),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id, user_type);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_web_users_updated BEFORE UPDATE ON web_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Données de départ
INSERT INTO web_users (email, password_hash, full_name, role)
VALUES ('admin@taxivanille.yt', '$2b$12$placeholder_change_on_first_login', 'Administrateur', 'direction');
