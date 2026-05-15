-- ═══════════════════════════════════════════════════════════════════
-- Migration 009 — Capacité véhicule & stats par direction
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Capacité véhicule par chauffeur ──────────────────────────────
ALTER TABLE drivers
  ADD COLUMN vehicle_seats SMALLINT NOT NULL DEFAULT 55;

COMMENT ON COLUMN drivers.vehicle_seats IS
  'Nombre de places assises du véhicule habituel du chauffeur (utilisé pour le calcul de capacité max des navettes)';

-- ─── 2. Vue : stats agrégées par direction ───────────────────────────
-- Calcule pour chaque (client, ligne, direction, date) :
--   avg_duration_min  = durée moyenne trajet (departed → end)
--   avg_pax_per_trip  = passagers moyens déclarés par chauffeur
--   nb_trips          = nombre de trajets dans ce sens ce jour
--   nb_drivers        = nombre de chauffeurs distincts
CREATE VIEW v_direction_stats AS
SELECT
  t.client_id,
  t.line_id,
  t.direction,
  DATE(t.scheduled_at AT TIME ZONE 'Indian/Mayotte')          AS trip_date,
  COUNT(DISTINCT t.id)                                        AS nb_trips,
  COUNT(DISTINCT t.driver_id)                                 AS nb_drivers,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (te_end.occurred_at - te_dep.occurred_at)) / 60
  ))::INTEGER                                                 AS avg_duration_min,
  COALESCE(ROUND(AVG(pax.total_in)), 0)::INTEGER              AS avg_pax_per_trip,
  COALESCE(SUM(pax.total_in), 0)::INTEGER                     AS total_passengers
FROM trips t
LEFT JOIN trip_events te_dep
  ON  te_dep.trip_id    = t.id
  AND te_dep.event_type = 'departed'
LEFT JOIN trip_events te_end
  ON  te_end.trip_id    = t.id
  AND te_end.event_type = 'end'
LEFT JOIN (
  SELECT trip_id, SUM(passengers_in) AS total_in
  FROM   trip_events
  GROUP  BY trip_id
) pax ON pax.trip_id = t.id
WHERE t.status    IN ('completed', 'in_progress')
  AND t.direction IS NOT NULL
GROUP BY
  t.client_id, t.line_id, t.direction,
  DATE(t.scheduled_at AT TIME ZONE 'Indian/Mayotte');

COMMENT ON VIEW v_direction_stats IS
  'Stats journalières par sens de trajet. '
  'La capacité max = nb_drivers × vehicle_seats × nb_trips. '
  'vehicle_seats est lu depuis drivers.vehicle_seats ou client_lines.vehicle_capacity.';

-- ─── 3. Référence API ────────────────────────────────────────────────
-- Requête type pour le rapport client (mois complet) :
--
--   SELECT
--     ds.direction,
--     ROUND(AVG(ds.avg_duration_min))  AS avg_duration_min,
--     ROUND(AVG(ds.avg_pax_per_trip))  AS avg_pax_per_trip,
--     SUM(ds.nb_trips)                 AS total_trips,
--     ROUND(AVG(ds.nb_drivers))        AS avg_drivers_per_day,
--     cl.vehicle_capacity              AS vehicle_seats
--   FROM v_direction_stats ds
--   JOIN client_lines cl ON cl.id = ds.line_id
--   WHERE ds.client_id = $1
--     AND ds.line_id   = $2
--     AND ds.trip_date BETWEEN $3 AND $4
--   GROUP BY ds.direction, cl.vehicle_capacity
--   ORDER BY ds.direction;
--
-- Capacité max jour = avg_drivers_per_day × vehicle_seats × (nb_trips / nb_jours_service)
-- Taux = avg_pax_per_trip / vehicle_seats × 100
