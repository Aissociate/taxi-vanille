-- Migration 005 — Billing formula v2
-- Adds trip categorisation, pricing config, and extended invoice fields

-- On-call flag on trips (for astreinte trip categorisation)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS astreinte BOOLEAN DEFAULT false;

-- Pricing rates table (single active row, editable by direction)
CREATE TABLE IF NOT EXISTS pricing_config (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   VARCHAR(100) NOT NULL DEFAULT 'Tarifs standard',
  astreinte_hourly_rate  NUMERIC(8,2) NOT NULL DEFAULT 0,
  fullhour_weekday_rate  NUMERIC(8,2) NOT NULL DEFAULT 0,
  after19h_weekday_rate  NUMERIC(8,2) NOT NULL DEFAULT 0,
  astreinte_trip_rate    NUMERIC(8,2) NOT NULL DEFAULT 0,
  saturday_rate          NUMERIC(8,2) NOT NULL DEFAULT 0,
  sunday_rate            NUMERIC(8,2) NOT NULL DEFAULT 0,
  km_threshold           INTEGER      NOT NULL DEFAULT 3500,
  km_surcharge_per_km    NUMERIC(8,3) NOT NULL DEFAULT 0,
  vehicle_rental_forfait NUMERIC(8,2) NOT NULL DEFAULT 0,
  management_fee         NUMERIC(8,2) NOT NULL DEFAULT 0,
  active                 BOOLEAN      DEFAULT true,
  created_at             TIMESTAMPTZ  DEFAULT now()
);

INSERT INTO pricing_config (name) VALUES ('Tarifs standard')
  ON CONFLICT DO NOTHING;

-- Extend invoices with billing formula fields
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS month              CHAR(7),
  ADD COLUMN IF NOT EXISTS on_call_hours      NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_rental     BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_repayment  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_total           INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_items         JSONB        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS net_amount         NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS pricing_config_id  UUID REFERENCES pricing_config(id);

-- One draft/validated invoice per driver per month
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_driver_month
  ON invoices (driver_id, month)
  WHERE month IS NOT NULL;
