-- ============================================================
-- 009 — Booking referans fotoğrafları + slot süresi seçenekleri
-- ============================================================
-- Müşteri booking sırasında referans foto ekleyebilir (çoklu). Ayrıca slot
-- süresi seçenekleri 4 saate (240dk) kadar genişletildi. Additive + idempotent.

-- ── Booking fotoğrafları ────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  url TEXT NOT NULL,
  path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_photos_appt ON appointment_photos(appointment_id);

ALTER TABLE appointment_photos ENABLE ROW LEVEL SECURITY;

-- Stüdyo personeli kendi tenant'ının fotoğraflarını okuyabilir; yazma service role.
DROP POLICY IF EXISTS "staff_read_appointment_photos" ON appointment_photos;
CREATE POLICY "staff_read_appointment_photos" ON appointment_photos
  FOR SELECT
  USING (public.is_staff_member() AND tenant_id = public.get_my_tenant_id());

-- ── Slot süresi: 4 saate kadar ──────────────────────────────
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_slot_duration_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_slot_duration_check
  CHECK (slot_duration_minutes IN (15, 30, 45, 60, 90, 120, 180, 240));
