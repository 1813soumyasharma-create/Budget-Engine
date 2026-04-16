// ============================================================
// BE — Stock Routes
// File: /be-app/server/routes/stock.js
// ============================================================

const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();

// ── GET /api/stock ───────────────────────────────────────────
// Accessible by vendors (public)
router.get('/', (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM stocks WHERE status = 'active' ORDER BY name ASC").all();
    res.json(data);
  } catch (err) {
    console.error('[STOCK GET]', err);
    res.status(500).json({ error: 'Failed to fetch stock: ' + err.message });
  }
});

// ── GET /api/stock/admin ─────────────────────────────────────
// Admin view (includes inactive items)
router.get('/admin', authMiddleware, (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM stocks ORDER BY id DESC').all();
    res.json(data);
  } catch (err) {
    console.error('[STOCK ADMIN GET]', err);
    res.status(500).json({ error: 'Failed to fetch admin stock list: ' + err.message });
  }
});

// ── POST /api/stock ──────────────────────────────────────────
// Admin only
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, price, description, category, unit, status } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = db.prepare(`
      INSERT INTO stocks (name, price, description, category, unit, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      parseFloat(price),
      description || '',
      category || 'General',
      unit || 'kg',
      status || 'active'
    );

    const record = db.prepare('SELECT * FROM stocks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (err) {
    console.error('[STOCK POST]', err);
    res.status(500).json({ error: 'Failed to add stock item: ' + err.message });
  }
});

// ── PUT /api/stock/:id ───────────────────────────────────────
// Admin only
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, unit, status } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = db.prepare(`
      UPDATE stocks
      SET name=?, price=?, description=?, category=?, unit=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      name,
      parseFloat(price),
      description || '',
      category || 'General',
      unit || 'kg',
      status || 'active',
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    const record = db.prepare('SELECT * FROM stocks WHERE id = ?').get(id);
    res.json(record);
  } catch (err) {
    console.error('[STOCK PUT]', err);
    res.status(500).json({ error: 'Failed to update stock item: ' + err.message });
  }
});

// ── DELETE /api/stock/:id ────────────────────────────────────
// Admin only
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM stocks WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    res.json({ success: true, id: parseInt(id) });
  } catch (err) {
    console.error('[STOCK DELETE]', err);
    res.status(500).json({ error: 'Failed to delete stock item: ' + err.message });
  }
});

module.exports = router;
