-- ============================================================
-- BE (Budget Engine) — SQLite Database Schema
-- File: /be-app/db/schema.sql
-- Run: This is auto-executed by server/db.js on first start
--      You can also run manually: sqlite3 be_database.db < schema.sql
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- TABLE: orders (Vendor purchase requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id        INTEGER NOT NULL,
  stock_id         INTEGER NOT NULL,
  quantity         REAL    NOT NULL DEFAULT 1,
  unit_price       REAL    NOT NULL,
  total_amount     REAL    NOT NULL,
  status           TEXT    DEFAULT 'pending', -- 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  order_date       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  FOREIGN KEY (stock_id)  REFERENCES stocks(id)
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         TEXT    NOT NULL UNIQUE,
  password_hash    TEXT    NOT NULL,
  firm_name        TEXT    DEFAULT 'My Organization',
  role             TEXT    DEFAULT 'admin',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: income
-- ============================================================
CREATE TABLE IF NOT EXISTS income (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             TEXT    NOT NULL,
  description      TEXT,
  category         TEXT    DEFAULT 'Other',
  amount           REAL    NOT NULL DEFAULT 0,
  gst_rate         REAL    DEFAULT 0,
  gst_amount       REAL    DEFAULT 0,
  total_amount     REAL    DEFAULT 0,
  invoice_no       TEXT,
  tally_synced     INTEGER DEFAULT 0,   -- 0 = pending, 1 = synced
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             TEXT    NOT NULL,
  description      TEXT,
  category         TEXT    DEFAULT 'Other',
  amount           REAL    NOT NULL DEFAULT 0,
  gst_rate         REAL    DEFAULT 0,
  gst_amount       REAL    DEFAULT 0,
  total_amount     REAL    DEFAULT 0,
  vendor           TEXT,
  voucher_no       TEXT,
  tally_synced     INTEGER DEFAULT 0,   -- 0 = pending, 1 = synced
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: tally_sync_log
-- ============================================================
CREATE TABLE IF NOT EXISTS tally_sync_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type        TEXT,     -- 'push' | 'pull'
  record_type      TEXT,     -- 'income' | 'expense'
  record_id        INTEGER,
  tally_voucher_no TEXT,
  status           TEXT,     -- 'success' | 'failed'
  message          TEXT,
  synced_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  key              TEXT    NOT NULL UNIQUE,
  value            TEXT
);

-- ============================================================
-- TABLE: excel_exports (tracks generated spreadsheets)
-- ============================================================
CREATE TABLE IF NOT EXISTS excel_exports (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name        TEXT    NOT NULL,
  file_path        TEXT    NOT NULL,
  export_type      TEXT,     -- 'income' | 'expense' | 'tally_sync' | 'full'
  triggered_by     TEXT,     -- 'manual' | 'tally_push' | 'tally_pull' | 'cron'
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: stocks (Items available for vendors to buy)
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  price            REAL    NOT NULL DEFAULT 0,
  description      TEXT,
  category         TEXT    DEFAULT 'General',
  unit             TEXT    DEFAULT 'kg',
  status           TEXT    DEFAULT 'active', -- 'active' | 'out_of_stock'
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES (for faster queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_income_date         ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_tally_synced ON income(tally_synced);
CREATE INDEX IF NOT EXISTS idx_income_category     ON income(category);

CREATE INDEX IF NOT EXISTS idx_expenses_date         ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_tally_synced ON expenses(tally_synced);
CREATE INDEX IF NOT EXISTS idx_expenses_category     ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_tally_sync_log_status ON tally_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_tally_sync_log_type   ON tally_sync_log(sync_type);

CREATE INDEX IF NOT EXISTS idx_stocks_status         ON stocks(status);

-- ============================================================
-- DEFAULT SETTINGS (inserted only if not already present)
-- ============================================================
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('firm_name',             'Valcon Admixture Pvt. Ltd.'),
  ('gst_number',            ''),
  ('address',               ''),
  ('financial_year_start',  '2024-04-01'),
  ('financial_year_end',    '2025-03-31'),
  ('currency',              'INR'),
  ('tally_host',            'localhost'),
  ('tally_port',            '9000'),
  ('tally_company',         ''),
  ('tally_auto_sync',       '0'),
  ('tally_sync_interval',   '5'),
  ('excel_auto_export',     '1'),
  ('theme',                 'dark');

-- ============================================================
-- SEED: Default admin user
-- Password: admin123  (bcrypt hash — regenerate in production!)
-- bcrypt hash of "admin123" with saltRounds=10
-- ============================================================
INSERT OR IGNORE INTO users (username, password_hash, firm_name, role)
VALUES (
  'admin',
  '$2a$10$c3Zzpa8TQaHeNGlWNz6X3uuLlmTJIMHl4aDlEZUyz0xwGiuex/GDO',
  'Valcon Admixture Pvt. Ltd.',
  'admin'
);

INSERT OR IGNORE INTO users (username, password_hash, firm_name, role)
VALUES (
  'vendor',
  '$2a$10$c6dcOavG4m0OndBAIghdquDxIcwJPEkQ7Jw.smDEoFu1bGX0b.gHq',
  'Authorized Vendor',
  'vendor'
);

-- ============================================================
-- SEED: Sample Stock Records
-- ============================================================
INSERT OR IGNORE INTO stocks (name, price, description, category, unit)
VALUES
  ('PCE Powder (High Grade)', 450, 'High performance PCE powder for admixtures', 'Raw Material', 'kg'),
  ('SNF Liquid (40% Solids)', 85, 'Standard SNF liquid for regular concrete', 'Raw Material', 'kg'),
  ('Defoamer - Silicone Based', 320, 'Antifoaming agent for concrete mixes', 'Additive', 'litre'),
  ('Lignosulfonate Powder', 65, 'Water reducing agent', 'Raw Material', 'kg'),
  ('VMA (Viscosity Modifying Agent)', 580, 'For self-compacting concrete', 'Additive', 'kg');

-- ============================================================
-- SEED: Sample Income Records (FY 2024-25)
-- ============================================================
INSERT OR IGNORE INTO income (date, description, category, amount, gst_rate, gst_amount, total_amount, invoice_no, tally_synced)
VALUES
  ('2024-04-05', 'PCE Superplasticizer Sales - Batch A',  'Product Sales', 125000, 18, 22500, 147500, 'INV-2024-001', 1),
  ('2024-04-18', 'SNF Superplasticizer Supply - Order 12','Product Sales', 98000,  18, 17640, 115640, 'INV-2024-002', 1),
  ('2024-05-02', 'Concrete Admixture Consulting',         'Service Income', 35000,  18, 6300,  41300,  'INV-2024-003', 1),
  ('2024-05-20', 'PCE Superplasticizer Sales - Batch B',  'Product Sales', 210000, 18, 37800, 247800, 'INV-2024-004', 1),
  ('2024-06-10', 'Raw Material Sales - Excess Stock',     'Raw Material Sales', 45000, 5, 2250, 47250, 'INV-2024-005', 1),
  ('2024-07-01', 'SNF Superplasticizer Supply - Order 18','Product Sales', 175000, 18, 31500, 206500, 'INV-2024-006', 1),
  ('2024-08-15', 'PCE Superplasticizer Sales - Batch C',  'Product Sales', 195000, 18, 35100, 230100, 'INV-2024-007', 1),
  ('2024-09-08', 'Technical Support Services',            'Service Income', 28000,  18, 5040,  33040,  'INV-2024-008', 0),
  ('2024-10-22', 'PCE Superplasticizer Sales - Batch D',  'Product Sales', 240000, 18, 43200, 283200, 'INV-2024-009', 0),
  ('2024-11-05', 'SNF Superplasticizer Supply - Order 24','Product Sales', 185000, 18, 33300, 218300, 'INV-2024-010', 0),
  ('2024-12-18', 'Year-End Product Sales',                'Product Sales', 310000, 18, 55800, 365800, 'INV-2024-011', 0),
  ('2025-01-10', 'PCE Superplasticizer Sales - Batch E',  'Product Sales', 275000, 18, 49500, 324500, 'INV-2025-001', 0),
  ('2025-02-14', 'Consulting - Mix Design Services',      'Service Income', 55000,  18, 9900,  64900,  'INV-2025-002', 0),
  ('2025-03-20', 'Final Quarter Sales - SNF Batch',       'Product Sales', 320000, 18, 57600, 377600, 'INV-2025-003', 0);

-- ============================================================
-- SEED: Sample Expense Records (FY 2024-25)
-- ============================================================
INSERT OR IGNORE INTO expenses (date, description, category, amount, gst_rate, gst_amount, total_amount, vendor, voucher_no, tally_synced)
VALUES
  ('2024-04-03', 'HPEG Raw Material Purchase',        'Raw Materials',        85000,  18, 15300, 100300, 'Sharma Chemicals',      'EXP-2024-001', 1),
  ('2024-04-10', 'Electricity Bill - Plant',          'Utilities',            12500,  0,  0,     12500,  'PSPCL',                 'EXP-2024-002', 1),
  ('2024-04-25', 'Worker Wages - April',              'Labour',               45000,  0,  0,     45000,  'Internal',              'EXP-2024-003', 1),
  ('2024-05-07', 'Polycarboxylate Ether Purchase',    'PCE Superplasticizer', 120000, 18, 21600, 141600, 'Macro Polymers Ltd.',   'EXP-2024-004', 1),
  ('2024-05-15', 'Transport & Logistics - May',       'Transport',            18000,  5,  900,   18900,  'FastMove Cargo',        'EXP-2024-005', 1),
  ('2024-06-02', 'Naphthalene Sulfonate Purchase',    'SNF Superplasticizer', 95000,  18, 17100, 112100, 'Global Chem Suppliers', 'EXP-2024-006', 1),
  ('2024-06-20', 'Plant Maintenance & Repairs',       'Maintenance',          22000,  18, 3960,  25960,  'TechFix Engineers',     'EXP-2024-007', 1),
  ('2024-07-05', 'Worker Wages - July',               'Labour',               46500,  0,  0,     46500,  'Internal',              'EXP-2024-008', 1),
  ('2024-08-12', 'Office Supplies & Stationery',      'Office',               8500,   18, 1530,  10030,  'Office Mart',           'EXP-2024-009', 0),
  ('2024-09-01', 'HPEG Raw Material - Bulk Order',    'Raw Materials',        180000, 18, 32400, 212400, 'Sharma Chemicals',      'EXP-2024-010', 0),
  ('2024-10-10', 'Electricity Bill - Q2',             'Utilities',            14200,  0,  0,     14200,  'PSPCL',                 'EXP-2024-011', 0),
  ('2024-11-18', 'PCE Monomer Purchase',              'PCE Superplasticizer', 145000, 18, 26100, 171100, 'Macro Polymers Ltd.',   'EXP-2024-012', 0),
  ('2024-12-05', 'Worker Wages - Dec + Bonus',        'Labour',               68000,  0,  0,     68000,  'Internal',              'EXP-2024-013', 0),
  ('2025-01-08', 'Transport - Q3 Deliveries',         'Transport',            24000,  5,  1200,  25200,  'FastMove Cargo',        'EXP-2025-001', 0),
  ('2025-02-20', 'SNF Raw Material Restock',          'SNF Superplasticizer', 110000, 18, 19800, 129800, 'Global Chem Suppliers', 'EXP-2025-002', 0),
  ('2025-03-15', 'Annual Plant Maintenance',          'Maintenance',          38000,  18, 6840,  44840,  'TechFix Engineers',     'EXP-2025-003', 0);

-- ============================================================
-- SEED: Sample Tally Sync Log
-- ============================================================
INSERT OR IGNORE INTO tally_sync_log (sync_type, record_type, record_id, tally_voucher_no, status, message)
VALUES
  ('push', 'income',  1, 'INV-2024-001', 'success', 'Voucher created in Tally successfully'),
  ('push', 'income',  2, 'INV-2024-002', 'success', 'Voucher created in Tally successfully'),
  ('push', 'expense', 1, 'EXP-2024-001', 'success', 'Payment voucher posted to Tally'),
  ('push', 'expense', 2, 'EXP-2024-002', 'success', 'Payment voucher posted to Tally'),
  ('pull', 'income',  3, 'INV-2024-003', 'success', 'Imported from Tally company ledger'),
  ('push', 'expense', 5, 'EXP-2024-005', 'failed',  'Tally connection timed out — retrying');

-- ============================================================
-- END OF SCHEMA
-- ============================================================