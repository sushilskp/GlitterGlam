-- ============================================================================
-- Production-Grade Database Schema Migration for Glitter Glam Jewelry Store
-- Target Database: Supabase PostgreSQL v15
--
-- This file is FULLY IDEMPOTENT. It can be run multiple times safely:
--   * Tables/columns use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
--   * Policies use a DO $$ wrapper that only creates them when missing
--   * Storage bucket and seed rows use ON CONFLICT DO NOTHING
-- ============================================================================

-- Enable UUID generation extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 0. user_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Customer' CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Staff', 'Customer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 1. customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. products
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount_price NUMERIC CHECK (discount_price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT 'Necklaces',
  type TEXT NOT NULL CHECK (type IN ('Artificial', '1 Gram Gold')),
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT DEFAULT '',
  material TEXT DEFAULT '',
  plating TEXT DEFAULT '',
  hallmark TEXT DEFAULT '',
  size_options TEXT[] DEFAULT '{"Free Size"}',
  weight TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 10 CHECK (stock >= 0),
  care_guide TEXT DEFAULT '',
  custom_order_enabled BOOLEAN DEFAULT false,
  occasion_tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Defensive column adds for legacy tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 4. coupons
-- ============================================================================
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  min_purchase NUMERIC NOT NULL DEFAULT 0 CHECK (min_purchase >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. offers
-- ============================================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  banner_image TEXT NOT NULL,
  discount TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('Active', 'Expired', 'Draft')) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  state TEXT NOT NULL,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  gst NUMERIC NOT NULL CHECK (gst >= 0),
  shipping NUMERIC NOT NULL CHECK (shipping >= 0),
  discount NUMERIC NOT NULL CHECK (discount >= 0),
  coupon_code TEXT REFERENCES coupons(code) ON DELETE SET NULL,
  total NUMERIC NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Card', 'UPI', 'NetBanking', 'COD')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
  order_status TEXT NOT NULL CHECK (order_status IN ('Processing', 'Dispatched', 'Delivered')),
  tracking_number TEXT,
  shipping_company TEXT,
  estimated_delivery TEXT,
  items_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. order_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  selected_size TEXT,
  gift_wrapped BOOLEAN DEFAULT false
);

-- ============================================================================
-- 8. audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  client_ip TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Defensive column adds so the new client fields always exist
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================================================
-- 9. reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  product_sku TEXT,
  approved BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Defensive column adds for legacy reviews tables
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

-- ============================================================================
-- 9b. video_reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_sku TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 10b. newsletter_subscribers (powers the footer subscribe form)
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'footer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 10. tickets
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 11. settings  (with all slideshow/banner columns included up front)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_text TEXT DEFAULT '',
  hero_headline TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  hero_banner_image TEXT DEFAULT '',
  hero_gallery_images TEXT[] DEFAULT '{}',
  instagram_handle TEXT DEFAULT '',
  facebook_handle TEXT DEFAULT '',
  whatsapp_contact TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  store_address TEXT DEFAULT '',
  store_timing TEXT DEFAULT '',
  google_analytics_id TEXT DEFAULT '',
  store_name TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  about_us_content TEXT DEFAULT '',
  trust_partners JSONB DEFAULT '[]',
  reviews_list JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Defensive column adds so re-running against an older settings table works
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_banner_image TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_gallery_images TEXT[] DEFAULT '{}';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_handle TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_us_content TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS trust_partners JSONB DEFAULT '[]';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS reviews_list JSONB DEFAULT '[]';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 12. Storage: 'assets' public bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. Enable RLS on every table (safe to re-run)
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. Policies — created only when missing, so this is fully re-runnable.
--     Helper: create_policy_if_missing(schema, table, policy, sql)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_policy_if_missing(
  p_schema TEXT,
  p_table  TEXT,
  p_policy TEXT,
  p_sql    TEXT
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = p_schema
      AND tablename  = p_table
      AND policyname = p_policy
  ) THEN
    EXECUTE p_sql;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ---- user_profiles ----
SELECT create_policy_if_missing('public', 'user_profiles',
  'Allow public read-only access for user_profiles',
  $SQL$CREATE POLICY "Allow public read-only access for user_profiles" ON user_profiles FOR SELECT USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'user_profiles',
  'Allow public insert on user_profiles',
  $SQL$CREATE POLICY "Allow public insert on user_profiles" ON user_profiles FOR INSERT WITH CHECK (true)$SQL$);

SELECT create_policy_if_missing('public', 'user_profiles',
  'Full admin power on user_profiles',
  $SQL$CREATE POLICY "Full admin power on user_profiles" ON user_profiles USING (true)$SQL$);

-- ---- categories ----
SELECT create_policy_if_missing('public', 'categories',
  'Allow public read-only access for categories',
  $SQL$CREATE POLICY "Allow public read-only access for categories" ON categories FOR SELECT USING (true)$SQL$);

-- ---- products ----
SELECT create_policy_if_missing('public', 'products',
  'Allow public read-only access for products',
  $SQL$CREATE POLICY "Allow public read-only access for products" ON products FOR SELECT USING (true)$SQL$);

-- ---- coupons ----
SELECT create_policy_if_missing('public', 'coupons',
  'Allow public read-only access for coupons',
  $SQL$CREATE POLICY "Allow public read-only access for coupons" ON coupons FOR SELECT USING (true)$SQL$);

-- ---- offers ----
SELECT create_policy_if_missing('public', 'offers',
  'Allow public read-only access for offers',
  $SQL$CREATE POLICY "Allow public read-only access for offers" ON offers FOR SELECT USING (true)$SQL$);

-- ---- reviews ----
SELECT create_policy_if_missing('public', 'reviews',
  'Allow public read-only access for reviews',
  $SQL$CREATE POLICY "Allow public read-only access for reviews" ON reviews FOR SELECT USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'reviews',
  'Allow public insert on reviews',
  $SQL$CREATE POLICY "Allow public insert on reviews" ON reviews FOR INSERT WITH CHECK (true)$SQL$);

-- ---- settings ----
SELECT create_policy_if_missing('public', 'settings',
  'Allow public read-only access for settings',
  $SQL$CREATE POLICY "Allow public read-only access for settings" ON settings FOR SELECT USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'settings',
  'Allow public upsert on settings',
  $SQL$CREATE POLICY "Allow public upsert on settings" ON settings FOR INSERT WITH CHECK (true)$SQL$);

SELECT create_policy_if_missing('public', 'settings',
  'Allow public update on settings',
  $SQL$CREATE POLICY "Allow public update on settings" ON settings FOR UPDATE USING (true) WITH CHECK (true)$SQL$);

-- ---- customers (public insert for checkouts) ----
SELECT create_policy_if_missing('public', 'customers',
  'Allow public inserts on customers',
  $SQL$CREATE POLICY "Allow public inserts on customers" ON customers FOR INSERT WITH CHECK (true)$SQL$);

-- ---- orders (public insert for checkouts) ----
SELECT create_policy_if_missing('public', 'orders',
  'Allow public inserts on orders',
  $SQL$CREATE POLICY "Allow public inserts on orders" ON orders FOR INSERT WITH CHECK (true)$SQL$);

-- ---- order_items (public insert for checkouts) ----
SELECT create_policy_if_missing('public', 'order_items',
  'Allow public inserts on order_items',
  $SQL$CREATE POLICY "Allow public inserts on order_items" ON order_items FOR INSERT WITH CHECK (true)$SQL$);

-- ---- tickets (public insert for contact form) ----
SELECT create_policy_if_missing('public', 'tickets',
  'Allow public inserts on tickets',
  $SQL$CREATE POLICY "Allow public inserts on tickets" ON tickets FOR INSERT WITH CHECK (true)$SQL$);

-- ---- audit_logs (public insert + select for user action tracking) ----
SELECT create_policy_if_missing('public', 'audit_logs',
  'Public insert audit_logs',
  $SQL$CREATE POLICY "Public insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true)$SQL$);

SELECT create_policy_if_missing('public', 'audit_logs',
  'Public or authenticated select audit_logs',
  $SQL$CREATE POLICY "Public or authenticated select audit_logs" ON audit_logs FOR SELECT USING (true)$SQL$);

-- ---- video_reviews ----
SELECT create_policy_if_missing('public', 'video_reviews',
  'Allow public read of video_reviews',
  $SQL$CREATE POLICY "Allow public read of video_reviews" ON video_reviews FOR SELECT USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'video_reviews',
  'Allow public insert of video_reviews',
  $SQL$CREATE POLICY "Allow public insert of video_reviews" ON video_reviews FOR INSERT WITH CHECK (true)$SQL$);

-- ---- newsletter_subscribers ----
SELECT create_policy_if_missing('public', 'newsletter_subscribers',
  'Allow public insert on newsletter_subscribers',
  $SQL$CREATE POLICY "Allow public insert on newsletter_subscribers" ON newsletter_subscribers FOR INSERT WITH CHECK (true)$SQL$);

SELECT create_policy_if_missing('public', 'newsletter_subscribers',
  'Allow public read on newsletter_subscribers',
  $SQL$CREATE POLICY "Allow public read on newsletter_subscribers" ON newsletter_subscribers FOR SELECT USING (true)$SQL$);

-- ---- Authenticated-admin full CRUD on general tables ----
SELECT create_policy_if_missing('public', 'customers',
  'Full admin power on customers',
  $SQL$CREATE POLICY "Full admin power on customers" ON customers TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'categories',
  'Full admin power on categories',
  $SQL$CREATE POLICY "Full admin power on categories" ON categories TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'products',
  'Full admin power on products',
  $SQL$CREATE POLICY "Full admin power on products" ON products TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'coupons',
  'Full admin power on coupons',
  $SQL$CREATE POLICY "Full admin power on coupons" ON coupons TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'offers',
  'Full admin power on offers',
  $SQL$CREATE POLICY "Full admin power on offers" ON offers TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'orders',
  'Full admin power on orders',
  $SQL$CREATE POLICY "Full admin power on orders" ON orders TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'order_items',
  'Full admin power on order_items',
  $SQL$CREATE POLICY "Full admin power on order_items" ON order_items TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'audit_logs',
  'Full admin power on audit_logs',
  $SQL$CREATE POLICY "Full admin power on audit_logs" ON audit_logs TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'reviews',
  'Full admin power on reviews',
  $SQL$CREATE POLICY "Full admin power on reviews" ON reviews TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'tickets',
  'Full admin power on tickets',
  $SQL$CREATE POLICY "Full admin power on tickets" ON tickets TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'settings',
  'Full admin power on settings',
  $SQL$CREATE POLICY "Full admin power on settings" ON settings TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'video_reviews',
  'Full admin power on video_reviews',
  $SQL$CREATE POLICY "Full admin power on video_reviews" ON video_reviews TO authenticated USING (true)$SQL$);

SELECT create_policy_if_missing('public', 'newsletter_subscribers',
  'Full admin power on newsletter_subscribers',
  $SQL$CREATE POLICY "Full admin power on newsletter_subscribers" ON newsletter_subscribers TO authenticated USING (true)$SQL$);

-- ============================================================================
-- 15. Storage policies (idempotent via the same helper)
-- ============================================================================
SELECT create_policy_if_missing('storage', 'objects',
  'Public read assets',
  $SQL$CREATE POLICY "Public read assets" ON storage.objects FOR SELECT USING (bucket_id = 'assets')$SQL$);

SELECT create_policy_if_missing('storage', 'objects',
  'Public upload assets',
  $SQL$CREATE POLICY "Public upload assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets')$SQL$);

SELECT create_policy_if_missing('storage', 'objects',
  'Public update assets',
  $SQL$CREATE POLICY "Public update assets" ON storage.objects FOR UPDATE USING (bucket_id = 'assets') WITH CHECK (bucket_id = 'assets')$SQL$);

SELECT create_policy_if_missing('storage', 'objects',
  'Public delete assets',
  $SQL$CREATE POLICY "Public delete assets" ON storage.objects FOR DELETE USING (bucket_id = 'assets')$SQL$);

-- ============================================================================
-- 16. Seed: default settings row (only inserted if missing)
-- ============================================================================
INSERT INTO settings (
  id, announcement_text, hero_headline, hero_subtitle,
  hero_gallery_images, hero_banner_image,
  instagram_handle, whatsapp_contact, support_email, store_address, store_timing
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Welcome to Glitter Glam!',
  'Breathtaking Artistry',
  'Discover our premium collections.',
  '{}', '',
  '@glitterglam', '+91 98769 76655', 'support@glitterglam.com',
  'Store Location', '10 AM - 8 PM'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 17. Seed: starter categories, coupons, and offers (idempotent)
-- ============================================================================
INSERT INTO categories (id, name, slug, image) VALUES
  ('22e84d9f-5089-4d87-98ef-5e2632b404d1', 'Necklaces', 'necklaces', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80'),
  ('11f26f2a-d9df-41ef-8d8a-6b8a1c970402', 'Earrings', 'earrings', 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=400&q=80'),
  ('cb2a8b3e-eef0-449e-b816-52e632b3c4f3', 'Rings', 'rings', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80'),
  ('9cbb3e18-e8cb-4690-b9cc-52e632b4b4e4', 'Bangles', 'bangles', 'https://images.unsplash.com/photo-1611085583191-a3b1a3a35d6a?auto=format&fit=crop&w=400&q=80'),
  ('f7c3e1b1-12ec-48be-9bc0-1e9bfbe7a8b9', 'Bracelets', 'bracelets', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO coupons (code, discount_percent, min_purchase, active) VALUES
  ('GLAM10', 10, 1000, true),
  ('BRIDAL20', 20, 5000, true),
  ('GOLDEN500', 15, 3000, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO offers (id, title, banner_image, discount, start_date, end_date, status) VALUES
  ('33f021bc-2ec1-4e8c-8f15-776f1c4e8b3a', 'Grand Bridal Fest', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=80', 'Flat 20% OFF', '2026-06-15', '2026-08-30', 'Active'),
  ('44f021bc-4ec1-4e8c-8f15-886f1c4e8b3b', '1 Gram Gold Launch Offer', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80', 'Free Protective Velvet Box', '2026-06-01', '2026-07-20', 'Active')
ON CONFLICT (id) DO NOTHING;
