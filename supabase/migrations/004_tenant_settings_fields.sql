-- ============================================================
-- 004 — Settings: ek tenant ayar kolonları
-- ============================================================
-- /settings Stüdyo Bilgileri (description) ve Randevu Ayarları
-- (slot_duration_minutes, auto_confirm) formları için.
-- Additive + idempotent.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN NOT NULL DEFAULT FALSE;

-- slot süresi yalnızca desteklenen değerlerden biri olabilir
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_slot_duration_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_slot_duration_check
  CHECK (slot_duration_minutes IN (15, 30, 45, 60));
