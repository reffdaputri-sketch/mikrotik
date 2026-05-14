-- NuxBill Next — Supabase Schema Migration
-- Konversi dari PHPNuxBill MySQL ke PostgreSQL Supabase

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- APP CONFIG
-- =============================================
CREATE TABLE IF NOT EXISTS app_config (
  id SERIAL PRIMARY KEY,
  setting TEXT NOT NULL UNIQUE,
  value TEXT
);

INSERT INTO app_config (setting, value) VALUES
  ('CompanyName', 'NuxBill'),
  ('currency_code', 'Rp'),
  ('timezone', 'Asia/Jakarta'),
  ('dec_point', ','),
  ('thousands_sep', '.'),
  ('date_format', 'd M Y'),
  ('note', 'Terima kasih telah berlangganan!')
ON CONFLICT (setting) DO NOTHING;

-- =============================================
-- ROUTERS (MikroTik)
-- =============================================
CREATE TABLE IF NOT EXISTS routers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  ip_address VARCHAR(128) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(60) NOT NULL,
  description VARCHAR(256),
  coordinates VARCHAR(50) DEFAULT '',
  status VARCHAR(10) DEFAULT 'Online' CHECK (status IN ('Online','Offline')),
  last_seen TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BANDWIDTHS
-- =============================================
CREATE TABLE IF NOT EXISTS bandwidths (
  id SERIAL PRIMARY KEY,
  name_bw VARCHAR(255) NOT NULL,
  rate_down INT NOT NULL,
  rate_down_unit VARCHAR(5) DEFAULT 'Mbps' CHECK (rate_down_unit IN ('Kbps','Mbps')),
  rate_up INT NOT NULL,
  rate_up_unit VARCHAR(5) DEFAULT 'Mbps' CHECK (rate_up_unit IN ('Kbps','Mbps')),
  burst VARCHAR(128) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLANS (Paket Internet)
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name_plan VARCHAR(40) NOT NULL,
  id_bw INT REFERENCES bandwidths(id),
  price DECIMAL(15,2) NOT NULL,
  price_old DECIMAL(15,2) DEFAULT 0,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Hotspot','PPPOE','Balance')),
  typebp VARCHAR(15) CHECK (typebp IN ('Unlimited','Limited')),
  limit_type VARCHAR(15) CHECK (limit_type IN ('Time_Limit','Data_Limit','Both_Limit')),
  time_limit INT,
  time_unit VARCHAR(5) CHECK (time_unit IN ('Mins','Hrs')),
  data_limit INT,
  data_unit VARCHAR(3) CHECK (data_unit IN ('MB','GB')),
  validity INT NOT NULL DEFAULT 30,
  validity_unit VARCHAR(10) NOT NULL DEFAULT 'Days' CHECK (validity_unit IN ('Mins','Hrs','Days','Months')),
  shared_users INT,
  router_id INT REFERENCES routers(id),
  pool VARCHAR(40),
  enabled BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop comment workaround (PostgreSQL tidak support inline COMMENT)
COMMENT ON COLUMN plans.is_public IS 'Tampil di storefront pelanggan';

-- =============================================
-- CUSTOMERS (Pelanggan)
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  username VARCHAR(45) NOT NULL UNIQUE,
  password VARCHAR(64) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(128),
  phonenumber VARCHAR(20),
  address TEXT,
  service_type VARCHAR(10) DEFAULT 'Hotspot' CHECK (service_type IN ('Hotspot','PPPoE','Others')),
  status VARCHAR(15) DEFAULT 'Active' CHECK (status IN ('Active','Banned','Disabled','Inactive')),
  balance DECIMAL(15,2) DEFAULT 0.00,
  auto_renewal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- =============================================
-- VOUCHERS
-- =============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(55) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Hotspot','PPPOE')),
  router_id INT REFERENCES routers(id),
  plan_id INT REFERENCES plans(id),
  username VARCHAR(45),
  password VARCHAR(45),
  status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  generated_by INT DEFAULT 0
);

-- =============================================
-- TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  invoice VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT REFERENCES customers(id),
  customer_name VARCHAR(100) NOT NULL,
  plan_id INT REFERENCES plans(id),
  plan_name VARCHAR(40) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  method VARCHAR(50) NOT NULL DEFAULT 'Manual',
  router_id INT REFERENCES routers(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('Hotspot','PPPOE','Balance')),
  voucher_id INT REFERENCES vouchers(id),
  note TEXT DEFAULT '',
  recharged_on DATE,
  expiration DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENT ORDERS (untuk payment gateway)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT REFERENCES customers(id),
  customer_name VARCHAR(100),
  customer_email VARCHAR(128),
  customer_phone VARCHAR(20),
  plan_id INT NOT NULL REFERENCES plans(id),
  plan_name VARCHAR(40) NOT NULL,
  router_id INT REFERENCES routers(id),
  price DECIMAL(15,2) NOT NULL,
  gateway VARCHAR(20) DEFAULT 'midtrans',
  gateway_trx_id VARCHAR(255),
  payment_type VARCHAR(50),
  snap_token TEXT,
  redirect_url TEXT,
  qr_code_url TEXT,
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired','cancelled')),
  expired_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  -- Setelah bayar, info voucher langsung tersimpan di sini
  voucher_code VARCHAR(55),
  voucher_username VARCHAR(45),
  voucher_password VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MIKROTIK COMMAND QUEUE (Inti Local Agent)
-- =============================================
CREATE TABLE IF NOT EXISTS mikrotik_command_queue (
  id SERIAL PRIMARY KEY,
  router_id INT NOT NULL REFERENCES routers(id),
  command VARCHAR(50) NOT NULL,
  -- e.g.: add_hotspot_user, remove_hotspot_user, add_pppoe_secret, etc.
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index untuk polling yang cepat
CREATE INDEX IF NOT EXISTS idx_command_queue_status ON mikrotik_command_queue(status, created_at);

-- =============================================
-- ADMIN USERS
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(45) NOT NULL UNIQUE,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(128),
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  user_type VARCHAR(15) DEFAULT 'Admin' CHECK (user_type IN ('SuperAdmin','Admin','Agent','Sales','Report')),
  status VARCHAR(10) DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default SuperAdmin (password: admin123 - GANTI SEGERA!)
INSERT INTO admin_users (username, fullname, email, password_hash, user_type)
VALUES ('admin', 'Administrator', 'admin@nuxbill.local',
  '$2b$10$XAbyxLRDcjTAdrUUK9.OjOAG7XYb8OJHgmnbWzS3LkY2w/JsUqAH2',
  'SuperAdmin')
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE REALTIME untuk command queue
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE mikrotik_command_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_orders;
