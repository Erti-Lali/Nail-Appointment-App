-- ============================================================
-- 005 — Müşteri favorileri (stüdyo / hizmet)
-- ============================================================
-- Müşteri panelindeki "Favorilerim" için. Bir favori ya bir stüdyoya
-- (type='studio', tenant_id dolu) ya da bir hizmete (type='service',
-- service_id dolu) işaret eder. Additive + idempotent.

CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('studio', 'service')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, tenant_id, service_id, type)
);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_profile ON customer_favorites(profile_id);

ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi favorilerini okuyup yazabilir.
DROP POLICY IF EXISTS "users_own_favorites" ON customer_favorites;
CREATE POLICY "users_own_favorites" ON customer_favorites
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
