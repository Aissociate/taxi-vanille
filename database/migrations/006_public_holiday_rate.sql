-- Migration 006 — Ajout du tarif jours fériés
ALTER TABLE pricing_config
  ADD COLUMN IF NOT EXISTS public_holiday_rate NUMERIC(8,2) NOT NULL DEFAULT 0;
