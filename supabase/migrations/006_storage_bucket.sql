-- ============================================================
-- 006 — Storage: tenant-content bucket + RLS
-- ============================================================
-- /content galeri görsellerinin doğrudan dosya yüklemesi için public bucket.
-- Path yapısı: {tenant_id}/{uuid}-{filename}
-- Not: Görevde "005" denmişti ama 005 customer_favorites tarafından kullanıldığı
-- için sıradaki numara (006) kullanıldı. Additive + idempotent.
--
-- Prod RLS helper'ları public.* şemasında: public.is_staff_member() +
-- public.get_my_tenant_id() (migration dosyalarındaki auth.* değil).

-- ── Bucket ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-content',
  'tenant-content',
  TRUE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies (storage.objects) ──────────────────────────────
-- Public read (bucket public; herkes okuyabilir)
DROP POLICY IF EXISTS "tenant_content_read" ON storage.objects;
CREATE POLICY "tenant_content_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tenant-content');

-- Personel yalnızca kendi tenant klasörü altına yükleyebilir
DROP POLICY IF EXISTS "tenant_content_insert" ON storage.objects;
CREATE POLICY "tenant_content_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-content'
    AND public.is_staff_member()
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
  );

-- Personel kendi tenant dosyalarını güncelleyebilir
DROP POLICY IF EXISTS "tenant_content_update" ON storage.objects;
CREATE POLICY "tenant_content_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-content'
    AND public.is_staff_member()
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
  );

-- Personel kendi tenant dosyalarını silebilir
DROP POLICY IF EXISTS "tenant_content_delete" ON storage.objects;
CREATE POLICY "tenant_content_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-content'
    AND public.is_staff_member()
    AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
  );
