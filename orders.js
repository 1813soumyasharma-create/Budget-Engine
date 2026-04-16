// ============================================================
// BE — Order Routes
// File: /be-app/server/routes/orders.js
// ============================================================

const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();

// ── GET /api/orders ──────────────────────────────────────────
// Vendors see their own orders, Admins see all
router.get('/', authMiddleware, (req, res) => {
  try {
    let sql = `
      SELECT o.*, s.name as item_name, u.username as vendor_name, u.firm_name
      FROM orders o
      JOIN stocks s ON o.stock_id = s.id
      JOIN users u ON o.vendor_id = u.id
    `;
    const params = [];

    if (req.user.role === 'vendor') {
      sql += ' WHERE o.vendor_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY o.order_date DESC';
    const data = db.prepare(sql).all(...params);
    res.json(data);
  } catch (err) {
    console.error('[ORDERS GET]', err);
    res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
  }
});

// ── POST /api/orders ─────────────────────────────────────────
// Vendor places an order
router.post('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can place orders' });
    }

    const { stock_id, quantity } = req.body;

    if (!stock_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid item and quantity are required' });
    }

    // Get current stock price
    const item = db.prepare('SELECT price FROM stocks WHERE id = ?').get(stock_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const unitPrice = item.price;
    const totalAmount = unitPrice * parseFloat(quantity);

    const result = db.prepare(`
      INSERT INTO orders (vendor_id, stock_id, quantity, unit_price, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, stock_id, parseFloat(quantity), unitPrice, totalAmount);

    const record = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (err) {
    console.error('[ORDERS POST]', err);
    res.status(500).json({ error: 'Failed to place order: ' + err.message });
  }
});

// ── PUT /api/orders/:id/status ──────────────────────────────
// Admin updates order status
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update order status' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error('[ORDERS PUT STATUS]', err);
    res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
});

module.exports = router;
