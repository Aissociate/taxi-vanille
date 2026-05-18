-- 013_planning_audit_entity_columns.sql
--
-- Le service AuditService (backend/src/common/audit.service.ts) et la requête
-- d'audit dans planning.service.ts référencent les colonnes `entity_type` et
-- `entity_id`, mais ces colonnes n'avaient jamais été ajoutées à la table.
--
-- Conséquence : la page Paramètres (qui charge l'audit) crashait avec
--   "column a.entity_type does not exist".
--
-- entity_id est TEXT (pas UUID) car il peut contenir soit un UUID (driver,
-- trip, client, invoice) soit un slug (section settings comme 'entreprise').

ALTER TABLE planning_audit
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS entity_id   TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON planning_audit (entity_type, entity_id, created_at DESC);
