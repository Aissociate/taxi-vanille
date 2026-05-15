-- Migration 002 — Table paramétrage application
CREATE TABLE IF NOT EXISTS settings (
  section     VARCHAR(50)  PRIMARY KEY,
  data        JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
