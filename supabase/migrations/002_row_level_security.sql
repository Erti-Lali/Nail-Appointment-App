-- ============================================================
-- Row Level Security (RLS) Policies
-- Multi-tenant isolation — every tenant only sees their data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_content ENABLE ROW LEVEL SECURITY;

-- ─── Helper functions ─────────────────────────────────────

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Is current user a super admin?
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Is current user a tenant admin or owner?
CREATE OR REPLACE FUNCTION auth.is_tenant_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'tenant_admin') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Is staff member of a tenant?
CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'tenant_admin', 'staff') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─── Tenants ──────────────────────────────────────────────

-- Super admins see all tenants
CREATE POLICY "super_admin_all_tenants" ON tenants
  FOR ALL USING (auth.is_super_admin());

-- Staff/admins see their own tenant
CREATE POLICY "tenant_member_see_own" ON tenants
  FOR SELECT USING (id = auth.tenant_id());

-- Public can read active tenant info (for booking page)
CREATE POLICY "public_read_active_tenants" ON tenants
  FOR SELECT USING (is_active = TRUE);

-- ─── Subscriptions ────────────────────────────────────────

CREATE POLICY "super_admin_all_subscriptions" ON subscriptions
  FOR ALL USING (auth.is_super_admin());

CREATE POLICY "tenant_admin_own_subscription" ON subscriptions
  FOR SELECT USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

-- ─── Profiles ─────────────────────────────────────────────

-- Users can read/update their own profile
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- Staff can read other profiles in their tenant
CREATE POLICY "staff_read_tenant_profiles" ON profiles
  FOR SELECT USING (tenant_id = auth.tenant_id() AND auth.is_staff());

-- Super admin has full access
CREATE POLICY "super_admin_all_profiles" ON profiles
  FOR ALL USING (auth.is_super_admin());

-- ─── Customers ────────────────────────────────────────────

-- Staff can manage customers in their tenant
CREATE POLICY "staff_manage_customers" ON customers
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_staff());

-- Customers can see their own record
CREATE POLICY "customer_own_record" ON customers
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "super_admin_all_customers" ON customers
  FOR ALL USING (auth.is_super_admin());

-- ─── Staff ────────────────────────────────────────────────

-- Staff see all staff in their tenant
CREATE POLICY "staff_see_tenant_staff" ON staff
  FOR SELECT USING (tenant_id = auth.tenant_id());

-- Admins manage staff in their tenant
CREATE POLICY "admin_manage_staff" ON staff
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

-- Public can see active staff (for booking)
CREATE POLICY "public_see_active_staff" ON staff
  FOR SELECT USING (is_active = TRUE AND accepts_online_booking = TRUE);

CREATE POLICY "super_admin_all_staff" ON staff
  FOR ALL USING (auth.is_super_admin());

-- ─── Staff Working Hours ──────────────────────────────────

CREATE POLICY "staff_see_working_hours" ON staff_working_hours
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY "admin_manage_working_hours" ON staff_working_hours
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

CREATE POLICY "public_see_working_hours" ON staff_working_hours
  FOR SELECT USING (TRUE); -- needed for availability check

-- ─── Services ─────────────────────────────────────────────

CREATE POLICY "staff_see_services" ON services
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY "admin_manage_services" ON services
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

CREATE POLICY "public_see_active_services" ON services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "super_admin_all_services" ON services
  FOR ALL USING (auth.is_super_admin());

-- ─── Service Categories ───────────────────────────────────

CREATE POLICY "staff_see_categories" ON service_categories
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY "admin_manage_categories" ON service_categories
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

CREATE POLICY "public_see_active_categories" ON service_categories
  FOR SELECT USING (is_active = TRUE);

-- ─── Appointments ─────────────────────────────────────────

-- Staff see all appointments in their tenant
CREATE POLICY "staff_see_appointments" ON appointments
  FOR SELECT USING (tenant_id = auth.tenant_id() AND auth.is_staff());

-- Staff can update appointments in their tenant
CREATE POLICY "staff_manage_appointments" ON appointments
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_staff());

-- Customers see their own appointments
CREATE POLICY "customer_own_appointments" ON appointments
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

-- Customers can insert appointments (for online booking)
CREATE POLICY "customer_book_appointment" ON appointments
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

-- Customers can cancel their own upcoming appointments
CREATE POLICY "customer_cancel_appointment" ON appointments
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
    AND status IN ('pending', 'confirmed')
    AND starts_at > NOW() + INTERVAL '24 hours'
  );

CREATE POLICY "super_admin_all_appointments" ON appointments
  FOR ALL USING (auth.is_super_admin());

-- ─── Notifications ────────────────────────────────────────

CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (recipient_id = auth.uid());

CREATE POLICY "admin_tenant_notifications" ON notifications
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

-- ─── Reviews ──────────────────────────────────────────────

CREATE POLICY "public_see_reviews" ON reviews
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "customer_own_reviews" ON reviews
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_see_tenant_reviews" ON reviews
  FOR SELECT USING (tenant_id = auth.tenant_id() AND auth.is_staff());

CREATE POLICY "admin_reply_to_reviews" ON reviews
  FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

-- ─── Tenant Content ───────────────────────────────────────

CREATE POLICY "admin_manage_content" ON tenant_content
  FOR ALL USING (tenant_id = auth.tenant_id() AND auth.is_tenant_admin());

CREATE POLICY "public_see_published_content" ON tenant_content
  FOR SELECT USING (is_published = TRUE);
