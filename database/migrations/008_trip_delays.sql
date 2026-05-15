-- ═══════════════════════════════════════════════════════════════════
-- Migration 008 — Suivi des retards au départ
-- Ajoute :
--   • v_trip_delays          – vue calculant le retard réel par trajet
--                              (heure départ planning vs clic chauffeur)
--   • client_daily_stats.retards_count – comptage journalier retards
--   • settings.chauffeurs    – paramètre retard_seuil_minutes (défaut 10)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Vue : délais de départ ───────────────────────────────────────
-- Source :
--   trips.scheduled_at          = heure de départ planifiée (back-office)
--   trip_events.occurred_at     = heure réelle de départ (clic "Départ"
--                                  dans l'app chauffeur, event_type='departed')
-- Délai = (occurred_at - scheduled_at) en minutes
-- Valeur positive  → départ en retard
-- Valeur négative  → départ en avance
CREATE VIEW v_trip_delays AS
SELECT
  t.id                                                          AS trip_id,
  t.driver_id,
  t.client_id,
  t.line_id,
  DATE(t.scheduled_at AT TIME ZONE 'Indian/Mayotte')            AS trip_date,
  t.scheduled_at                                                AS planned_at,
  te.occurred_at                                                AS departed_at,
  ROUND(
    EXTRACT(EPOCH FROM (te.occurred_at - t.scheduled_at)) / 60
  )::INTEGER                                                    AS delay_minutes
FROM trips t
JOIN trip_events te
  ON  te.trip_id    = t.id
  AND te.event_type = 'departed'
WHERE t.status IN ('completed', 'in_progress');

COMMENT ON VIEW v_trip_delays IS
  'Délai en minutes entre l''heure planifiée et le clic "Départ" dans l''app chauffeur. '
  'Positif = retard, négatif = avance. Filtrer sur delay_minutes > seuil pour comptage retards.';

-- ─── 2. Colonne retards dans les stats journalières ──────────────────
ALTER TABLE client_daily_stats
  ADD COLUMN retards_count SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN client_daily_stats.retards_count IS
  'Nombre de départs dépassant le seuil de retard configuré (settings.chauffeurs.retard_seuil_minutes)';

-- Index pour requêtes par date / ligne
CREATE INDEX ON client_daily_stats (client_id, date) WHERE retards_count > 0;

-- ─── 3. Vue mensuelle : inclure les retards ──────────────────────────
-- Remplace la vue v_client_monthly_stats de la migration 007
DROP VIEW IF EXISTS v_client_monthly_stats;

CREATE VIEW v_client_monthly_stats AS
SELECT
  s.client_id,
  s.line_id,
  cl.code   AS line_code,
  cl.name   AS line_name,
  s.month,
  COUNT(*)                            AS jours_service,
  SUM(s.usagers)                      AS total_usagers,
  SUM(s.usagers_matin)                AS total_usagers_matin,
  SUM(s.usagers_am)                   AS total_usagers_am,
  ROUND(AVG(s.taux))::SMALLINT        AS avg_taux,
  ROUND(AVG(s.taux_matin))::SMALLINT  AS avg_taux_matin,
  ROUND(AVG(s.taux_am))::SMALLINT     AS avg_taux_am,
  COUNT(*) FILTER (WHERE s.taux >= 90) AS jours_saturation,
  SUM(s.incidents_count)              AS total_incidents,
  SUM(s.unplanned_trips)              AS total_unplanned,
  SUM(s.retards_count)                AS total_retards
FROM   client_daily_stats s
LEFT JOIN client_lines cl ON cl.id = s.line_id
GROUP BY s.client_id, s.line_id, cl.code, cl.name, s.month;

-- ─── 4. Requête de référence : calculer les retards d'une période ────
-- Exemple d'utilisation côté API (Node/Postgres) :
--
--   SELECT
--     d.trip_date,
--     COUNT(*) FILTER (WHERE d.delay_minutes > $seuil) AS retards_count
--   FROM v_trip_delays d
--   WHERE d.client_id   = $client_id
--     AND d.trip_date BETWEEN $date_start AND $date_end
--   GROUP BY d.trip_date
--   ORDER BY d.trip_date;
--
-- $seuil est lu depuis : SELECT (data->>'retard_seuil_minutes')::INT
--                        FROM settings WHERE section = 'chauffeurs'

-- ─── 5. Paramètre par défaut dans settings ───────────────────────────
-- Ajoute retard_seuil_minutes = 10 à la section 'chauffeurs'
-- ON CONFLICT merge JSONB pour ne pas écraser les autres clés existantes
INSERT INTO settings (section, data)
VALUES ('chauffeurs', '{"retard_seuil_minutes": 10}')
ON CONFLICT (section) DO UPDATE
  SET data       = settings.data || EXCLUDED.data,
      updated_at = now();
