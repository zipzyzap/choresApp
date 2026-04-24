const express = require('express');
const router  = express.Router();
const { getDb, resetDatabase } = require('../database');

// GET /api/settings — all settings as a key/value object
router.get('/', (req, res) => {
  const db   = getDb();
  const rows = db.prepare(`SELECT key, value FROM settings`).all();

  // Return as a flat object { reset_time: '06:00', pin: '1234', ... }
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

// PATCH /api/settings — update one or more settings
router.patch('/', (req, res) => {
  const db     = getDb();
  const update = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const allowed = ['reset_time', 'pin', 'pin_lockout_attempts', 'pin_timeout_minutes'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update.run(key, String(req.body[key]));
    }
  }

  const rows     = db.prepare(`SELECT key, value FROM settings`).all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

// POST /api/settings/verify-pin — check PIN without exposing it
router.post('/verify-pin', (req, res) => {
  const db  = getDb();
  const { pin } = req.body;

  const stored = db.prepare(`SELECT value FROM settings WHERE key = 'pin'`).get();
  if (!stored)  return res.status(500).json({ error: 'PIN not configured' });

  res.json({ valid: pin === stored.value });
});

// POST /api/settings/reset — wipe and rebuild the database (PIN required)
router.post('/reset', (req, res) => {
  const db  = getDb();
  const { pin } = req.body;

  const stored = db.prepare(`SELECT value FROM settings WHERE key = 'pin'`).get();
  if (!stored || pin !== stored.value) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  resetDatabase();
  res.json({ success: true });
});

// POST /api/settings/adjust-points — manually award or deduct points
router.post('/adjust-points', (req, res) => {
  const db = getDb();
  const { child_id, amount, note } = req.body;

  if (!child_id || amount === undefined) {
    return res.status(400).json({ error: 'child_id and amount are required' });
  }

  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(child_id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  db.prepare(`
    UPDATE children SET points = MAX(0, points + ?) WHERE id = ?
  `).run(amount, child_id);

  db.prepare(`
    INSERT INTO point_adjustments (child_id, amount, note) VALUES (?, ?, ?)
  `).run(child_id, amount, note || null);

  const updated = db.prepare(`SELECT * FROM children WHERE id = ?`).get(child_id);
  res.json({ success: true, points: updated.points });
});

module.exports = router;