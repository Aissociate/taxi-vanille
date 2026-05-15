-- ═══════════════════════════════════════════════════════════════════
-- Migration 010 — Archive des rapports clients
-- Ajoute :
--   • client_reports  – rapports mensuels archivés (snapshot KPIs + commentaire)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE client_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  line_id          UUID        REFERENCES client_lines(id)   ON DELETE SET NULL,

  -- Période couverte par le rapport
  period_start     DATE        NOT NULL,
  period_end       DATE        NOT NULL,
  month            CHAR(7)     GENERATED ALWAYS AS (to_char(period_start, 'YYYY-MM')) STORED,

  -- Titre libre
  title            TEXT,

  -- Snapshot KPIs principaux (copiés au moment de la génération)
  total_usagers    INTEGER,
  avg_taux         SMALLINT,
  jours_service    SMALLINT,
  total_incidents  SMALLINT,
  total_retards    SMALLINT,
  total_unplanned  SMALLINT,

  -- Commentaire rédigé (IA ou manuel)
  comment          TEXT,

  -- Snapshot JSON complet (données journalières + direction stats)
  snapshot         JSONB,

  -- Qui a généré le rapport
  generated_by     UUID        REFERENCES web_users(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE client_reports IS
  'Archives des rapports institutionnels générés pour les clients. '
  'Chaque ligne est un snapshot point-dans-le-temps des KPIs + commentaire.';

CREATE TRIGGER trg_client_reports_updated_at
  BEFORE UPDATE ON client_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX ON client_reports (client_id, month);
CREATE INDEX ON client_reports (line_id);
CREATE INDEX ON client_reports (created_at DESC);
CREATE INDEX ON client_reports (generated_by);
