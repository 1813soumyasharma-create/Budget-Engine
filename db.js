// ============================================================
// BE (Budget Engine) — Database Initialization
// File: /be-app/server/db.js
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ── Path configuration ──────────────────────────────────────
const DB_DIR = path.join(__dirname, '..', 'db');
const DB_PATH = path.join(DB_DIR, 'be_database.db');
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');

// Ensure /db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log('[DB] Created /db directory');
}

// ── Open / create database ───────────────────────────────────
let db;
try {
  db = new Database(DB_PATH, { verbose: process.env.DB_DEBUG ? console.log : null });
  console.log(`[DB] Connected → ${DB_PATH}`);
} catch (err) {
  console.error('[DB] Failed to open database:', err.message);
  process.exit(1);
}

// ── Apply performance pragmas ────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ── Initialize schema from schema.sql ────────────────────────
function initializeSchema() {
  try {
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schema);
      console.log('[DB] Schema initialized from schema.sql');
    } else {
      // Fallback: run inline schema if schema.sql not found
      console.warn('[DB] schema.sql not found — running inline schema fallback');
      runInlineSchema();
    }
  } catch (err) {
    console.error('[DB] Schema initialization error:', err.message);
    process.exit(1);
  }
}

// ── Inline schema fallback ────────────────────────────────────
function runInlineSchema() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      firm_name TEXT DEFAULT 'My Organization',
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Other',
      amount REAL NOT NULL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      invoice_no TEXT,
      tally_synced INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Other',
      amount REAL NOT NULL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      vendor TEXT,
      voucher_no TEXT,
      tally_synced INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tally_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT,
      record_type TEXT,
      record_id INTEGER,
      tally_voucher_no TEXT,
      status TEXT,
      message TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS excel_exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      export_type TEXT,
      triggered_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('firm_name',            'Valcon Admixture Pvt. Ltd.'),
      ('gst_number',           ''),
      ('financial_year_start', '2024-04-01'),
      ('financial_year_end',   '2025-03-31'),
      ('currency',             'INR'),
      ('tally_host',           'localhost'),
      ('tally_port',           '9000'),
      ('tally_auto_sync',      '0'),
      ('tally_sync_interval',  '5'),
      ('excel_auto_export',    '1'),
      ('theme',                'dark');

    INSERT OR IGNORE INTO users (username, password_hash, firm_name, role)
    VALUES (
      'admin',
      '$2a$10$c3Zzpa8TQaHeNGlWNz6X3uuLlmTJIMHl4aDlEZUyz0xwGiuex/GDO',
      'Valcon Admixture Pvt. Ltd.',
      'admin'
    );
  `);
}

// ── Prepared statement helpers ────────────────────────────────

/**
 * Get a setting value by key
 * @param {string} key
 * @returns {string|null}
 */
function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

/**
 * Update or insert a setting
 * @param {string} key
 * @param {string} value
 */
function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

/**
 * Get all settings as a key-value object
 * @returns {Object}
 */
function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
}

/**
 * Log a Tally sync event
 */
function logTallySync({ sync_type, record_type, record_id, tally_voucher_no, status, message }) {
  db.prepare(`
    INSERT INTO tally_sync_log (sync_type, record_type, record_id, tally_voucher_no, status, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sync_type, record_type, record_id, tally_voucher_no, status, message);
}

/**
 * Log an Excel export event
 */
function logExcelExport({ file_name, file_path, export_type, triggered_by }) {
  db.prepare(`
    INSERT INTO excel_exports (file_name, file_path, export_type, triggered_by)
    VALUES (?, ?, ?, ?)
  `).run(file_name, file_path, export_type, triggered_by);
}

/**
 * Get dashboard summary data
 * @param {string} fyStart - Financial year start date (YYYY-MM-DD)
 * @param {string} fyEnd   - Financial year end date (YYYY-MM-DD)
 */
function getDashboardSummary(fyStart, fyEnd) {
  const totalIncome = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM income WHERE date BETWEEN ? AND ?
  `).get(fyStart, fyEnd).total;

  const totalExpenses = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM expenses WHERE date BETWEEN ? AND ?
  `).get(fyStart, fyEnd).total;

  const pendingSyncs = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM income WHERE tally_synced = 0) +
      (SELECT COUNT(*) FROM expenses WHERE tally_synced = 0) AS count
  `).get().count;

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    pendingSyncs
  };
}

/**
 * Get monthly income and expense totals for bar chart
 * @param {string} fyStart
 * @param {string} fyEnd
 */
function getMonthlyChartData(fyStart, fyEnd) {
  const months = [];
  const start = new Date(fyStart);

  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const income = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM income WHERE strftime('%Y-%m', date) = ?
    `).get(monthStr).total;

    const expense = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM expenses WHERE strftime('%Y-%m', date) = ?
    `).get(monthStr).total;

    months.push({
      month: d.toLocaleString('en-IN', { month: 'short' }) + ' ' + d.getFullYear(),
      income,
      expense
    });
  }

  return months;
}

// ── Initialize on load ────────────────────────────────────────
initializeSchema();

// ── Exports ───────────────────────────────────────────────────
module.exports = {
  db,
  getSetting,
  setSetting,
  getAllSettings,
  logTallySync,
  logExcelExport,
  getDashboardSummary,
  getMonthlyChartData
};