-- =====================================================
-- Susu Collector - Supabase Migration + Seed Data
-- Run this in: Supabase → SQL Editor → New query
-- =====================================================

-- ========================
-- 1. CREATE TABLES
-- ========================

CREATE TABLE IF NOT EXISTS collectors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  zone TEXT NOT NULL DEFAULT 'General',
  avatar_url TEXT,
  total_customers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  collector_id INTEGER NOT NULL REFERENCES collectors(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  savings_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  collection_status TEXT NOT NULL DEFAULT 'pending',
  loan_status TEXT NOT NULL DEFAULT 'none',
  outstanding_loan NUMERIC(12,2),
  last_collection_date DATE,
  avatar_url TEXT,
  notes TEXT,
  total_collected NUMERIC(12,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  collector_id INTEGER NOT NULL REFERENCES collectors(id),
  amount NUMERIC(12,2) NOT NULL,
  collection_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  receipt_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  principal_amount NUMERIC(12,2) NOT NULL,
  outstanding_balance NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  due_date DATE,
  total_repaid NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  collector_id INTEGER NOT NULL REFERENCES collectors(id),
  collection_id INTEGER,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- 2. DISABLE RLS
-- (allows anon key full access — fine for a field agent app
--  where auth is handled by the Express API layer)
-- ========================

ALTER TABLE collectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and service roles
GRANT ALL ON collectors  TO anon, service_role;
GRANT ALL ON customers   TO anon, service_role;
GRANT ALL ON collections TO anon, service_role;
GRANT ALL ON loans       TO anon, service_role;
GRANT ALL ON receipts    TO anon, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;

-- ========================
-- 3. SEED DATA
-- ========================

-- Collector account (email: collector@susu.gh / password: password123)
-- password_hash = SHA256("password123" + "susu_salt_2024")
INSERT INTO collectors (name, email, password_hash, phone, zone, total_customers)
VALUES (
  'Kwame Mensah',
  'collector@susu.gh',
  'db171244b70506b7ca71398d7b22e55d900e40507566d2c57988107ade05cd59',
  '+233 24 456 7890',
  'Accra Central',
  8
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Customers
INSERT INTO customers (collector_id, name, phone, address, savings_balance, collection_status, loan_status, outstanding_loan, last_collection_date, total_collected, joined_at)
VALUES
(1, 'Abena Osei',    '+233 20 123 4567', '12 Ring Road, Accra',           1250.00, 'collected', 'none',   NULL,    CURRENT_DATE,     3400.00, NOW() - INTERVAL '60 days'),
(1, 'Kofi Asante',   '+233 24 987 6543', '45 High Street, Tema',           870.50, 'pending',   'active', 1500.00, CURRENT_DATE - 1, 2100.50, NOW() - INTERVAL '60 days'),
(1, 'Ama Boateng',   '+233 27 555 1234', '7 Liberation Road, Accra',      2100.00, 'collected', 'paid',   NULL,    CURRENT_DATE,     5600.00, NOW() - INTERVAL '30 days'),
(1, 'Yaw Darko',     '+233 23 444 5678', '89 Spintex Road, Accra',         450.00, 'overdue',   'overdue',2000.00, CURRENT_DATE - 3,  980.00, NOW() - INTERVAL '60 days'),
(1, 'Akosua Mensah', '+233 26 777 8901', '3 Cantonments Road, Accra',     3200.00, 'collected', 'none',   NULL,    CURRENT_DATE,     8900.00, NOW() - INTERVAL '60 days'),
(1, 'Kweku Adjei',   '+233 20 333 2222', '21 Oxford Street, Osu',          600.00, 'pending',   'active',  800.00, CURRENT_DATE - 2, 1560.00, NOW() - INTERVAL '30 days'),
(1, 'Efua Takyi',    '+233 24 888 3456', '55 Labadi Road, Accra',         1800.00, 'collected', 'none',   NULL,    CURRENT_DATE,     4200.00, NOW() - INTERVAL '60 days'),
(1, 'Nana Owusu',    '+233 27 111 9876', '18 Airport Road, Accra',         920.00, 'pending',   'active', 1200.00, CURRENT_DATE - 1, 2340.00, NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Collections (7-day trend)
INSERT INTO collections (customer_id, collector_id, amount, collection_date, payment_method, status, notes)
SELECT c.id, 1, v.amount, v.cdate, v.method, 'completed', v.note
FROM (VALUES
  (1, 150.00, CURRENT_DATE,       'cash',          'Morning visit'),
  (3, 200.00, CURRENT_DATE,       'mobile_money',  NULL),
  (5, 300.00, CURRENT_DATE,       'cash',          'Regular monthly'),
  (7, 180.00, CURRENT_DATE,       'mobile_money',  NULL),
  (2, 100.00, CURRENT_DATE - 1,   'cash',          NULL),
  (4,  50.00, CURRENT_DATE - 1,   'mobile_money',  'Partial payment'),
  (6, 120.00, CURRENT_DATE - 2,   'cash',          NULL),
  (8,  90.00, CURRENT_DATE - 2,   'bank_transfer', NULL),
  (1, 150.00, CURRENT_DATE - 3,   'cash',          NULL),
  (2, 100.00, CURRENT_DATE - 3,   'cash',          NULL),
  (3, 200.00, CURRENT_DATE - 4,   'mobile_money',  NULL),
  (5, 300.00, CURRENT_DATE - 5,   'cash',          NULL),
  (7, 180.00, CURRENT_DATE - 6,   'mobile_money',  NULL)
) AS v(cid, amount, cdate, method, note)
JOIN customers c ON c.id = v.cid AND c.collector_id = 1
ON CONFLICT DO NOTHING;

-- Loans
INSERT INTO loans (customer_id, principal_amount, outstanding_balance, interest_rate, status, start_date, due_date, total_repaid)
SELECT c.id, v.principal, v.outstanding, v.rate, v.status, v.sdate, v.ddate, v.repaid
FROM (VALUES
  (2, 2000.00, 1500.00, 5.00, 'active',  CURRENT_DATE - 45, CURRENT_DATE + 45, 500.00),
  (4, 3000.00, 2000.00, 7.50, 'overdue', CURRENT_DATE - 90, CURRENT_DATE - 10, 1000.00),
  (6, 1000.00,  800.00, 5.00, 'active',  CURRENT_DATE - 20, CURRENT_DATE + 40,  200.00),
  (8, 1500.00, 1200.00, 6.00, 'active',  CURRENT_DATE - 15, CURRENT_DATE + 45,  300.00),
  (3, 4000.00,    0.00, 5.00, 'paid',    CURRENT_DATE - 180,CURRENT_DATE - 30, 4000.00)
) AS v(cid, principal, outstanding, rate, status, sdate, ddate, repaid)
JOIN customers c ON c.id = v.cid AND c.collector_id = 1
ON CONFLICT DO NOTHING;

-- Receipts
INSERT INTO receipts (customer_id, collector_id, file_url, file_type, file_name, status, notes)
SELECT c.id, 1, v.url, v.ftype, v.fname, v.status, v.note
FROM (VALUES
  (1, 'https://placehold.co/400x600/1a1a2e/22c55e?text=Receipt+001', 'image', 'receipt_abena_001.jpg',  'verified', NULL),
  (3, 'https://placehold.co/400x600/16213e/22c55e?text=Receipt+002', 'image', 'receipt_ama_001.jpg',    'verified', NULL),
  (5, 'https://placehold.co/400x600/0f3460/22c55e?text=Receipt+003', 'image', 'receipt_akosua_001.jpg', 'pending',  NULL),
  (2, 'https://placehold.co/400x600/1e293b/22c55e?text=Receipt+004', 'pdf',   'receipt_kofi_001.pdf',   'verified', 'Manual verification done'),
  (4, 'https://placehold.co/400x600/7f1d1d/ffffff?text=Receipt+005', 'image', 'receipt_yaw_001.jpg',    'rejected', 'Blurry image'),
  (7, 'https://placehold.co/400x600/1a1a2e/22c55e?text=Receipt+006', 'image', 'receipt_efua_001.jpg',   'pending',  NULL)
) AS v(cid, url, ftype, fname, status, note)
JOIN customers c ON c.id = v.cid AND c.collector_id = 1
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'collectors' AS tbl, COUNT(*) FROM collectors
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'collections', COUNT(*) FROM collections
UNION ALL SELECT 'loans', COUNT(*) FROM loans
UNION ALL SELECT 'receipts', COUNT(*) FROM receipts;
