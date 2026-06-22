-- ============================================================
-- 003 — Tenant admin update policy
-- ============================================================
--
-- NOTE: The remote DB's RLS helpers live in the `public` schema with
-- different names than 002 (auth.*) suggests — the live names are
-- get_my_tenant_id() and is_tenant_admin(). This migration matches the
-- live schema (see `tenant_member_see_own` which uses get_my_tenant_id()).
--
-- The `tenant_content` table and its policies (public_see_published_content,
-- admin_manage_content) already exist from 001/002, so they are NOT recreated
-- here.

-- Tenant admins/owners can UPDATE their own tenant (settings page).
-- (Previously only SELECT was allowed → settings forms couldn't save.)
DROP POLICY IF EXISTS "tenant_admin_update_own" ON tenants;
CREATE POLICY "tenant_admin_update_own" ON tenants
  FOR UPDATE
  USING (id = get_my_tenant_id() AND is_tenant_admin())
  WITH CHECK (id = get_my_tenant_id() AND is_tenant_admin());
