-- ═══════════════════════════════════════════════════════════════════
-- Migration 007 — Client reporting & unplanned trips
-- Adds:
--   • trip_direction_enum  – direction sémantique d'un trajet
--   • trips.direction      – sens du trajet (matin_aller/retour, am_aller/retour)
--   • trips.is_unplanned   – flag trajet non prévu au planning initial
--   • trips.passenger_count– comptage rapide sans agréger trip_events
--   • client_lines         – définition des lignes/routes par client
--   • client_daily_stats   – stats journalières agrégées (remplaçables manuellement)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Enum : sens du trajet ────────────────────────────────────────
CREATE TYPE trip_direction_enum AS ENUM (
  'matin_aller',   -- matin, sens aller  (ex. Vahibe → PEM)
  'matin_retour',  -- matin, sens retour (ex. PEM → Vahibe)
  'am_aller',      -- après-midi, sens aller
  'am_retour'      -- après-midi, sens retour
);

-- ─── 2. Extension de la table trips ──────────────────────────────────
ALTER TABLE trips
  ADD COLUMN direction       trip_direction_enum,
  ADD COLUMN is_unplanned    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN passenger_count INTEGER;

COMMENT ON COLUMN trips.direction       IS 'Sens sémantique du trajet (matin/am × aller/retour)';
COMMENT ON COLUMN trips.is_unplanned    IS 'true = trajet ajouté manuellement, absent du planning initial';
COMMENT ON COLUMN trips.passenger_count IS 'Comptage passagers total pour ce trajet (alternatif à SUM trip_events)';

-- Index pour les filtres fréquents
CREATE INDEX ON trips (direction);
CREATE INDEX ON trips (is_unplanned) WHERE is_unplanned = true;
CREATE INDEX ON trips (client_id, direction, is_unplanned);

-- ─── 3. Table : lignes/routes par client ─────────────────────────────
-- Définit les routes opérationnelles rattachées à chaque client,
-- avec les libellés de directions et la capacité véhicule.
CREATE TABLE client_lines (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  code             TEXT        NOT NULL,                    -- 'L4'
  name             TEXT        NOT NULL,                    -- 'Ligne 4'
  badge            TEXT        NOT NULL DEFAULT 'AO',       -- 'AO', 'MARCHÉ'…
  color            TEXT        NOT NULL DEFAULT '#7c3aed',  -- couleur UI
  vehicle_capacity INTEGER     NOT NULL DEFAULT 55,         -- nb places assises

  -- Libellés affichés dans les rapports
  dir_matin_a      TEXT        NOT NULL,   -- ex. 'Vahibe → PEM'
  dir_matin_r      TEXT        NOT NULL,   -- ex. 'PEM → Vahibe'
  dir_am_a         TEXT        NOT NULL,   -- ex. 'PEM → Vahibe'
  dir_am_r         TEXT        NOT NULL,   -- ex. 'Vahibe → PEM'

  -- Taux de fréquentation par direction (mise à jour mensuelle)
  taux_matin_a     SMALLINT,
  taux_matin_r     SMALLINT,
  taux_am_a        SMALLINT,
  taux_am_r        SMALLINT,

  active           BOOLEAN     NOT NULL DEFAULT true,
  sort_order       SMALLINT    NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (client_id, code)
);

CREATE TRIGGER trg_client_lines_updated_at
  BEFORE UPDATE ON client_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX ON client_lines (client_id);
CREATE INDEX ON client_lines (client_id, active);

-- Lier les trajets à la ligne (nullable pour les anciens trajets)
ALTER TABLE trips
  ADD COLUMN line_id UUID REFERENCES client_lines(id) ON DELETE SET NULL;

CREATE INDEX ON trips (line_id);

-- ─── 4. Table : statistiques journalières client ──────────────────────
-- Sources de données :
--   • Calculées automatiquement depuis trip_events (is_manual = false)
--   • Saisies/corrigées manuellement par la direction (is_manual = true)
-- L'unicité est sur (client_id, line_id, date) : une ligne par jour par ligne.
CREATE TABLE client_daily_stats (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  line_id          UUID        REFERENCES client_lines(id)  ON DELETE CASCADE,
  date             DATE        NOT NULL,
  month            CHAR(7)     GENERATED ALWAYS AS (lpad(extract(year from date)::int::text, 4, '0') || '-' || lpad(extract(month from date)::int::text, 2, '0')) STORED,

  -- Comptages passagers (jour entier)
  usagers          INTEGER,          -- total journée
  usagers_matin    INTEGER,          -- total tournées matin
  usagers_am       INTEGER,          -- total tournées après-midi

  -- Taux de fréquentation (0–100 %)
  taux             SMALLINT,         -- global
  taux_matin       SMALLINT,         -- matin
  taux_am          SMALLINT,         -- après-midi

  -- Comptage incidents liés à ce jour/ligne
  incidents_count  SMALLINT    NOT NULL DEFAULT 0,

  -- Trajets non planifiés ayant eu lieu ce jour pour cette ligne
  unplanned_trips  SMALLINT    NOT NULL DEFAULT 0,

  -- Provenance / surcharge manuelle
  is_manual        BOOLEAN     NOT NULL DEFAULT false,
  notes            TEXT,
  updated_by       UUID        REFERENCES web_users(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (client_id, line_id, date)
);

CREATE TRIGGER trg_client_daily_stats_updated_at
  BEFORE UPDATE ON client_daily_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX ON client_daily_stats (client_id, date);
CREATE INDEX ON client_daily_stats (line_id, date);
CREATE INDEX ON client_daily_stats (client_id, month);
CREATE INDEX ON client_daily_stats (date) WHERE is_manual = true;

-- ─── 5. Vue agrégée (utile pour l'API rapport) ───────────────────────
-- Vue pour récupérer rapidement les stats d'un mois avec le détail lignes.
CREATE VIEW v_client_monthly_stats AS
SELECT
  s.client_id,
  s.line_id,
  cl.code   AS line_code,
  cl.name   AS line_name,
  s.month,
  COUNT(*)                          AS jours_service,
  SUM(s.usagers)                    AS total_usagers,
  SUM(s.usagers_matin)              AS total_usagers_matin,
  SUM(s.usagers_am)                 AS total_usagers_am,
  ROUND(AVG(s.taux))::SMALLINT      AS avg_taux,
  ROUND(AVG(s.taux_matin))::SMALLINT AS avg_taux_matin,
  ROUND(AVG(s.taux_am))::SMALLINT   AS avg_taux_am,
  COUNT(*) FILTER (WHERE s.taux >= 90) AS jours_saturation,
  SUM(s.incidents_count)            AS total_incidents,
  SUM(s.unplanned_trips)            AS total_unplanned
FROM   client_daily_stats s
LEFT JOIN client_lines cl ON cl.id = s.line_id
GROUP BY s.client_id, s.line_id, cl.code, cl.name, s.month;

-- ─── 6. Données initiales — lignes des clients existants ─────────────
-- À exécuter après avoir inséré les clients en base.
-- Ces INSERT utilisent ON CONFLICT DO NOTHING pour être idempotents.
DO $$
DECLARE
  cid_cadema UUID;
  cid_chm    UUID;
BEGIN
  SELECT id INTO cid_cadema FROM clients WHERE name ILIKE '%CADEMA%' LIMIT 1;
  SELECT id INTO cid_chm    FROM clients WHERE name ILIKE '%CHM%'    LIMIT 1;

  -- CADEMA Ligne 3
  IF cid_cadema IS NOT NULL THEN
    INSERT INTO client_lines
      (client_id, code, name, badge, color, vehicle_capacity,
       dir_matin_a, dir_matin_r, dir_am_a, dir_am_r, sort_order)
    VALUES
      (cid_cadema, 'L3', 'Ligne 3', 'AO', '#E8601A', 55,
       'Doujani → Passot Barge', 'Passot Barge → Doujani',
       'Passot Barge → Doujani', 'Doujani → Passot Barge', 10)
    ON CONFLICT (client_id, code) DO NOTHING;

    -- CADEMA Ligne 4
    INSERT INTO client_lines
      (client_id, code, name, badge, color, vehicle_capacity,
       dir_matin_a, dir_matin_r, dir_am_a, dir_am_r, sort_order)
    VALUES
      (cid_cadema, 'L4', 'Ligne 4', 'AO', '#7c3aed', 55,
       'Vahibe → Passamainty (PEM)', 'Passamainty (PEM) → Vahibe',
       'Passamainty (PEM) → Vahibe', 'Vahibe → Passamainty (PEM)', 20)
    ON CONFLICT (client_id, code) DO NOTHING;
  END IF;

  -- CHM Petite-Terre
  IF cid_chm IS NOT NULL THEN
    INSERT INTO client_lines
      (client_id, code, name, badge, color, vehicle_capacity,
       dir_matin_a, dir_matin_r, dir_am_a, dir_am_r, sort_order)
    VALUES
      (cid_chm, 'CHM-PT', 'Petite-Terre', 'MARCHÉ', '#059669', 45,
       'CHM → La Barge', 'La Barge → CHM',
       'La Barge → CHM', 'CHM → La Barge', 10)
    ON CONFLICT (client_id, code) DO NOTHING;
  END IF;
END $$;
