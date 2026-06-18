-- ============================================================
-- NailStudio 101 — Initial Database Schema
-- Multi-tenant SaaS for nail studios
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search

-- ─── Enums ────────────────────────────────────────────────

CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'paused');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show');
CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'technician', 'receptionist');
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'staff', 'customer');
CREATE TYPE gender_type AS ENUM ('female', 'male', 'other', 'prefer_not_to_say');
CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'whatsapp');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE booking_source AS ENUM ('online', 'phone', 'walk_in', 'instagram', 'admin');
CREATE TYPE content_type AS ENUM ('gallery', 'before_after', 'announcement', 'offer');

-- ─── Tenants (Nail Studios) ───────────────────────────────

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  cover_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website TEXT,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'TR',
  timezone VARCHAR(100) DEFAULT 'Europe/Istanbul',
  currency VARCHAR(10) DEFAULT 'TRY',
  locale VARCHAR(10) DEFAULT 'tr',
  primary_color VARCHAR(7) DEFAULT '#C9A84C',
  secondary_color VARCHAR(7) DEFAULT '#1A1A1A',
  booking_advance_days INTEGER DEFAULT 30,
  cancellation_hours INTEGER DEFAULT 24,
  reminder_hours INTEGER[] DEFAULT '{24, 2}',
  instagram_handle VARCHAR(100),
  google_maps_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscriptions ────────────────────────────────────────

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan subscription_plan DEFAULT 'starter',
  status subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiles (extends auth.users) ───────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  role user_role DEFAULT 'customer',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  gender gender_type,
  birth_date DATE,
  preferred_language VARCHAR(10) DEFAULT 'tr',
  notification_preferences notification_channel[] DEFAULT '{push, sms}',
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Customers ────────────────────────────────────────────

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  gender gender_type,
  birth_date DATE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  referred_by_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- ─── Staff ────────────────────────────────────────────────

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role staff_role DEFAULT 'technician',
  display_name VARCHAR(200) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  color VARCHAR(7) DEFAULT '#C9A84C',
  is_active BOOLEAN DEFAULT TRUE,
  accepts_online_booking BOOLEAN DEFAULT TRUE,
  booking_buffer_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Staff Working Hours ──────────────────────────────────

CREATE TABLE staff_working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  is_working BOOLEAN DEFAULT TRUE,
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '18:00',
  break_start TIME,
  break_end TIME,
  UNIQUE(staff_id, day_of_week)
);

-- ─── Staff Time Off ───────────────────────────────────────

CREATE TABLE staff_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Service Categories ───────────────────────────────────

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ─── Services ─────────────────────────────────────────────

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_max DECIMAL(10,2),
  deposit_required BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10,2),
  max_parallel INTEGER DEFAULT 1,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Service ↔ Staff ──────────────────────────────────────

CREATE TABLE service_staff (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  custom_duration INTEGER,
  custom_price DECIMAL(10,2),
  PRIMARY KEY (service_id, staff_id)
);

-- ─── Appointments ─────────────────────────────────────────

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  status appointment_status DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  customer_notes TEXT,
  staff_notes TEXT,
  reminder_sent_at TIMESTAMPTZ,
  booked_via booking_source DEFAULT 'online',
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent double-booking same staff at same time
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status NOT IN ('canceled', 'no_show'))
);

-- ─── Notifications ────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reviews ──────────────────────────────────────────────

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT,
  replied_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id) -- one review per appointment
);

-- ─── Tenant Content (CMS) ─────────────────────────────────

CREATE TABLE tenant_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title VARCHAR(500),
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────

-- Appointments
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_staff_time ON appointments(staff_id, starts_at);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_starts_at ON appointments(tenant_id, starts_at);

-- Customers
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_name ON customers USING gin(
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- Profiles
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(tenant_id, role);

-- Services
CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_category ON services(category_id);

-- Staff
CREATE INDEX idx_staff_tenant ON staff(tenant_id);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);

-- Reviews
CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX idx_reviews_staff ON reviews(staff_id);

-- ─── Updated_at trigger ───────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Auto-create profile on user signup ───────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Auto-create subscription on tenant creation ──────────

CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (tenant_id, plan, status)
  VALUES (NEW.id, 'starter', 'trialing');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION handle_new_tenant();

-- ─── Update customer stats after appointment ──────────────

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE customers
    SET
      total_visits = total_visits + 1,
      total_spent = total_spent + NEW.final_price,
      loyalty_points = loyalty_points + FLOOR(NEW.final_price / 10)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();
