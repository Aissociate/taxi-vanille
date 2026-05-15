-- Taxi Vanille Mayotte — Migration 003
-- Gestion des acomptes et remboursements chauffeurs

CREATE TABLE driver_advances (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_driver_advances_driver ON driver_advances(driver_id);

CREATE TABLE driver_advance_repayments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  advance_id  UUID        NOT NULL REFERENCES driver_advances(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_repayments_advance ON driver_advance_repayments(advance_id);
