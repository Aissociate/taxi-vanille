-- ═══════════════════════════════════════════════════════════════════
-- Migration 012 — Heure d'arrivée estimée sur les trajets
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS estimated_arrival_at TIMESTAMPTZ;

COMMENT ON COLUMN trips.estimated_arrival_at IS
  'Heure d''arrivée estimée (saisie à la création/modification)';
