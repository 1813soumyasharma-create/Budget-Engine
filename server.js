// ============================================================
// BE (Budget Engine) — Express Server Entry Point
// File: /be-app/server/server.js
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const { db, getSetting, logTallySync } = require('./db');
const { buildVoucherXML } = require('./utils/tallyUtils');

// ── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const tallyRoutes = require('./routes/tally');
const settingsRoutes = require('./routes/settings');
const stockRoutes = require('./routes/stock');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend files ──────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ensure /exports directory exists
const fs = require('fs');
const exportsDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tally', tallyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// ── Fallback: serve index.html for non-API routes ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Cron: Auto-sync with Tally every N minutes ───────────────
let cronJob = null;

function startAutoSync() {
  const interval = parseInt(getSetting('tally_sync_interval') || '5', 10);
  const expression = `*/${interval} * * * *`;

  if (cronJob) cronJob.stop();

  cronJob = cron.schedule(expression, async () => {
    const autoSync = getSetting('tally_auto_sync');
    if (autoSync !== '1') return;

    console.log('[CRON] Running scheduled Tally sync...');
    try {
      // Push unsynced income records
      const unsyncedIncome = db.prepare(
        `SELECT * FROM income WHERE tally_synced = 0 LIMIT 50`
      ).all();

      const unsyncedExpenses = db.prepare(
        `SELECT * FROM expenses WHERE tally_synced = 0 LIMIT 50`
      ).all();

      const tallyHost = getSetting('tally_host') || 'localhost';
      const tallyPort = getSetting('tally_port') || '9000';
      const fetch = require('node-fetch');

      for (const record of [...unsyncedIncome, ...unsyncedExpenses]) {
        const isIncome = 'invoice_no' in record;
        const xml = buildVoucherXML(record, isIncome ? 'Receipt' : 'Payment');

        try {
          const res = await fetch(`http://${tallyHost}:${tallyPort}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml,
            timeout: 5000
          });

          if (res.ok) {
            const table = isIncome ? 'income' : 'expenses';
            db.prepare(`UPDATE ${table} SET tally_synced = 1 WHERE id = ?`).run(record.id);
            logTallySync({
              sync_type: 'push', record_type: isIncome ? 'income' : 'expense',
              record_id: record.id,
              tally_voucher_no: isIncome ? record.invoice_no : record.voucher_no,
              status: 'success', message: '[CRON] Auto-synced successfully'
            });
          }
        } catch (err) {
          logTallySync({
            sync_type: 'push', record_type: isIncome ? 'income' : 'expense',
            record_id: record.id, tally_voucher_no: null,
            status: 'failed', message: `[CRON] ${err.message}`
          });
        }
      }
      console.log(`[CRON] Sync done — ${unsyncedIncome.length + unsyncedExpenses.length} records processed`);
    } catch (err) {
      console.error('[CRON] Auto-sync error:', err.message);
    }
  });

  console.log(`[CRON] Auto-sync scheduled every ${interval} minutes`);
}

// Removed redundant buildTallyXML function

startAutoSync();

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[BE] Budget Engine running at http://localhost:${PORT}`);
  console.log(`[BE] Default login: admin / admin123`);
});