-- ============================================================
-- 007 — Randevu hatırlatmaları (zamanlanmış SMS / e-posta)
-- ============================================================
-- Randevu oluşturulunca tenants.reminder_hours'a göre satırlar planlanır;
-- /api/cron/reminders bunları zamanı gelince gönderir.
-- Not: Görevde "005" denmişti ama 005/006 kullanıldığı için sıradaki numara (007).
-- Additive + idempotent.

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Aynı randevu/kanal/zaman için ikinci kez planlamayı engelle (idempotent insert)
  UNIQUE (appointment_id, channel, scheduled_at)
);

-- Bekleyen (henüz gönderilmemiş/başarısız olmamış) hatırlatmalar için kısmi index
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON appointment_reminders(scheduled_at)
  WHERE sent_at IS NULL AND failed_at IS NULL;

-- RLS: politika yok → yalnızca service role (RLS'i bypass eder) erişebilir.
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
