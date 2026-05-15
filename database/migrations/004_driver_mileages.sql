-- Taxi Vanille Mayotte — Migration 004
-- Kilométrage mensuel déclaratif par chauffeur (app Android → web)

CREATE TABLE driver_mileages (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id         UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  month             CHAR(7)     NOT NULL,           -- YYYY-MM
  km_start          INTEGER     CHECK (km_start >= 0),
  km_end            INTEGER     CHECK (km_end >= 0),
  declared_start_at TIMESTAMPTZ,
  declared_end_at   TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(driver_id, month)
);

CREATE INDEX idx_driver_mileages_driver ON driver_mileages(driver_id);
CREATE INDEX idx_driver_mileages_month  ON driver_mileages(month);
