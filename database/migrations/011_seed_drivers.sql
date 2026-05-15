-- ═══════════════════════════════════════════════════════════════════
-- Migration 011 — Seed chauffeurs (données réelles Taxi Vanille)
-- PIN par défaut : 1234 (à changer au premier login mobile)
-- ═══════════════════════════════════════════════════════════════════

-- Hash bcrypt pour PIN "1234" (cost 10)
-- Tous les chauffeurs démarrent avec ce PIN par défaut
DO $$
DECLARE
  pin TEXT := '$2b$10$/2zwUGsPUcAqo06Z5yrcFuPh1elExlcb617U0dlAgV0IbeaA9lJVq';
BEGIN

-- ─── Ligne 3 (CADEMA) — préfixe D ────────────────────────────────────
INSERT INTO drivers (driver_number, pin_hash, full_name, phone, rate_config, invoice_period)
VALUES
  ('D1',  pin, 'MOHAMED Ali',              '06 39 40 35 35', '{}', 'weekly'),
  ('D2',  pin, 'BARAKA Soumaila',           '06 39 24 71 32', '{}', 'weekly'),
  ('D3',  pin, 'ABDOURAHIM Mohamed',        '06 39 67 24 24', '{}', 'weekly'),
  ('D4',  pin, 'AMBDI Houmadi',             '06 39 23 55 69', '{}', 'weekly'),
  ('D5',  pin, 'AMINA Selemani',            '06 93 32 32 68', '{}', 'weekly'),
  ('D6',  pin, 'ABDOU HAMIDOUNE Nassabia',  '06 39 23 54 34', '{}', 'weekly'),
  ('D7',  pin, 'COMBO Said',                '06 39 68 37 93', '{}', 'weekly'),
  ('D8',  pin, 'ISSOUF Dailami',            '06 39 40 54 45', '{}', 'weekly'),
  ('D9',  pin, 'RENEE Assanati',            '06 39 07 82 51', '{}', 'weekly'),
  ('D10', pin, 'KAMARDINE Mansour',         '06 39 21 15 43', '{}', 'weekly'),
  ('D11', pin, 'ALLAOUI Soibrane',          '06 39 99 08 35', '{}', 'weekly'),
  ('D12', pin, 'VELOU M''COLO M''Berou',    '06 39 27 46 76', '{}', 'weekly'),
  ('D13', pin, 'MOURIDI Aktoir',            '06 39 03 27 63', '{}', 'weekly'),
  ('D14', pin, 'AHAMADI Laydine',           '06 39 58 51 87', '{}', 'weekly')
ON CONFLICT (driver_number) DO NOTHING;

-- ─── Ligne 4 (CADEMA) — préfixe C ────────────────────────────────────
INSERT INTO drivers (driver_number, pin_hash, full_name, phone, rate_config, invoice_period)
VALUES
  ('C1',  pin, 'EL ANZIZE Hamada',         '06 39 22 81 28', '{}', 'weekly'),
  ('C2',  pin, 'BINA HALADI Bina',          '06 39 06 05 82', '{}', 'weekly'),
  ('C3',  pin, 'ABDOU MINIHADJI Amada',     '06 39 65 03 93', '{}', 'weekly'),
  ('C4',  pin, 'TOUMBOU Toibourani',        '06 39 19 14 22', '{}', 'weekly'),
  ('C5',  pin, 'AHAMADI Raenmouddine',      '06 39 02 40 54', '{}', 'weekly'),
  ('C6',  pin, 'OUSSENI Soula',             '06 39 69 03 87', '{}', 'weekly'),
  ('C7',  pin, 'HAMIDOU Dahalani',          '06 39 97 83 04', '{}', 'weekly'),
  ('C8',  pin, 'HADHURAMI Makinedine',      '06 39 94 46 40', '{}', 'weekly'),
  ('C9',  pin, 'SANDI Maanrouf',            '06 39 40 58 85', '{}', 'weekly'),
  ('C10', pin, 'ISSIHAKA M''Changama',      '06 39 27 71 41', '{}', 'weekly'),
  ('C11', pin, 'MADI BOINA Mkidachi',       '06 39 22 08 67', '{}', 'weekly'),
  ('C12', pin, 'ALILOIFFA Said Siradj',     '06 39 39 15 17', '{}', 'weekly'),
  ('C13', pin, 'ABDALLAH Ben',              '06 39 63 48 34', '{}', 'weekly'),
  ('C14', pin, 'KAMARDINE Mansour L4',      '06 39 21 15 43', '{}', 'weekly')
ON CONFLICT (driver_number) DO NOTHING;

-- ─── CHM Petite-Terre — préfixe H ─────────────────────────────────────
INSERT INTO drivers (driver_number, pin_hash, full_name, phone, rate_config, invoice_period)
VALUES
  ('H1', pin, 'CHADHOULI Houmadi',   '06 39 02 29 70', '{}', 'weekly'),
  ('H2', pin, 'CHAMSSOUNE Ahmed',    '06 39 95 35 45', '{}', 'weekly'),
  ('H3', pin, 'SAID ALI Kamile',     '06 39 22 01 83', '{}', 'weekly'),
  ('H4', pin, 'BACAR ALI Mohamed',   '07 83 82 76 52', '{}', 'weekly'),
  ('H5', pin, 'ATTOUMANI Kamaldine', '06 39 66 69 21', '{}', 'weekly'),
  ('H6', pin, 'MADI Hamada',         '06 39 61 35 52', '{}', 'weekly'),
  ('H7', pin, 'OIHABOU Bacari',      '06 39 21 37 01', '{}', 'weekly'),
  ('H8', pin, 'AHMED Abdallah',      '06 39 22 39 00', '{}', 'weekly')
ON CONFLICT (driver_number) DO NOTHING;

END $$;
