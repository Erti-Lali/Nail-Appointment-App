-- ============================================================
-- 003 — Tenant admin update policy + content insert helper
-- ============================================================

-- Tenant admins/owners can UPDATE their own tenant (settings page).
-- (Previously only SELECT was allowed → settings forms couldn't save.)
DROP POLICY IF EXISTS "tenant_admin_update_own" ON tenants;
CREATE POLICY "tenant_admin_update_own" ON tenants
  FOR UPDATE
  USING (id = auth.tenant_id() AND auth.is_tenant_admin())
  WITH CHECK (id = auth.tenant_id() AND auth.is_tenant_admin());
