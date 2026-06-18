-- Production-Grade Database Schema Migration for Glitter Glam Jewelry Store
-- Target Database: Supabase PostgreSQL v15

-- Enable UUID generation extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Create user_profiles table for role-based access control (RBAC)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Customer' CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Staff', 'Customer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Create customers table
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

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create products table
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  min_purchase NUMERIC NOT NULL DEFAULT 0 CHECK (min_purchase >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create offers table
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

-- 6. Create orders table
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

-- 7. Create order_items table
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

-- 8. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  product_sku TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create tickets table
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

-- 11. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_text TEXT DEFAULT '',
  hero_headline TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  instagram_handle TEXT DEFAULT '',
  whatsapp_contact TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  store_address TEXT DEFAULT '',
  store_timing TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Setup Access Policies
CREATE POLICY "Allow public read-only access for user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Full admin power on user_profiles" ON user_profiles USING (true);

CREATE POLICY "Allow public read-only access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read-only access for settings" ON settings FOR SELECT USING (true);

-- Allow public inserts for checkouts and leads
CREATE POLICY "Allow public inserts on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts on order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts on tickets" ON tickets FOR INSERT WITH CHECK (true);

-- Authenticated admins power full CRUD on general tables
CREATE POLICY "Full admin power on customers" ON customers TO authenticated USING (true);
CREATE POLICY "Full admin power on categories" ON categories TO authenticated USING (true);
CREATE POLICY "Full admin power on products" ON products TO authenticated USING (true);
CREATE POLICY "Full admin power on coupons" ON coupons TO authenticated USING (true);
CREATE POLICY "Full admin power on offers" ON offers TO authenticated USING (true);
CREATE POLICY "Full admin power on orders" ON orders TO authenticated USING (true);
CREATE POLICY "Full admin power on order_items" ON order_items TO authenticated USING (true);
CREATE POLICY "Full admin power on audit_logs" ON audit_logs TO authenticated USING (true);
CREATE POLICY "Full admin power on reviews" ON reviews TO authenticated USING (true);
CREATE POLICY "Full admin power on tickets" ON tickets TO authenticated USING (true);
CREATE POLICY "Full admin power on settings" ON settings TO authenticated USING (true);

-- Enable public select/insert on audit_logs for user action tracking
CREATE POLICY "Public insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public or authenticated select audit_logs" ON audit_logs FOR SELECT USING (true);

-- Seed initial basic values to bootstrap tables if needed
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
