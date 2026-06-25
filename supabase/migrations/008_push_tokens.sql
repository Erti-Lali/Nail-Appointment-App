-- ============================================================
-- 008 — Mobil push notification token'ları
-- ============================================================
-- Expo push token kaydı (mobil cihaz başına). Hatırlatma cron'u channel='push'
-- satırları için bu tablodan token çeker. Additive + idempotent.
--
-- Sapmalar (görev şemasına göre):
--  • tenant_id NULLABLE yapıldı — customer ve bazı admin profillerinde tenant_id
--    NULL olduğu için NOT NULL kayıt eklemeyi kırardı.
--  • RLS açıldı, politika yok = yalnızca service role (kayıt/gönderim sunucudan).
-- Görevde "00X" denmişti; 005/006/007 dolu olduğu için 008 kullanıldı.

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_profile ON push_tokens(profile_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
