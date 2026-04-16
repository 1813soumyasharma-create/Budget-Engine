// ============================================================
// BE — User Management Routes
// File: /be-app/server/routes/users.js
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();

// ── GET /api/users ───────────────────────────────────────────
// Admin only
router.get('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const users = db.prepare('SELECT id, username, firm_name, role, created_at FROM users ORDER BY role ASC, username ASC').all();
    res.json(users);
  } catch (err) {
    console.error('[USERS GET]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── POST /api/users ──────────────────────────────────────────
// Admin only
router.post('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, password, firm_name, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, firm_name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, passwordHash, firm_name || '', role);

    res.status(201).json({ id: result.lastInsertRowid, username, firm_name, role });
  } catch (err) {
    console.error('[USERS POST]', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── PUT /api/users/:id ───────────────────────────────────────
// Admin only
router.put('/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { username, password, firm_name, role } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    let sql = 'UPDATE users SET username = ?, firm_name = ?, role = ?';
    const params = [username, firm_name || '', role];

    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      sql += ', password_hash = ?';
      params.push(passwordHash);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(sql).run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, id });
  } catch (err) {
    console.error('[USERS PUT]', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────
// Admin only
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, id });
  } catch (err) {
    console.error('[USERS DELETE]', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
