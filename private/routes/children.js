const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');

// GET /api/children — all children ordered by sort_order
router.get('/', (req, res) => {
  const db = getDb();
  const children = db.prepare(`
    SELECT * FROM children ORDER BY sort_order, id
  `).all();
  res.json(children);
});

// GET /api/children/:id — single child
router.get('/:id', (req, res) => {
  const db    = getDb();
  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });
  res.json(child);
});

// POST /api/children — create a new child profile
router.post('/', (req, res) => {
  const db = getDb();
  const { name, avatar, accent, theme, rewards } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  // Place new child at the end of the list
  const last = db.prepare(`SELECT MAX(sort_order) as max FROM children`).get();
  const sort_order = (last.max ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO children (name, avatar, accent, theme, rewards, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    avatar     || '😊',
    accent     || '#4A90D9',
    theme      || 'default',
    rewards    ? 1 : 0,
    sort_order
  );

  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(child);
});

// PATCH /api/children/:id — update any child fields
router.patch('/:id', (req, res) => {
  const db    = getDb();
  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  const fields = ['name', 'avatar', 'accent', 'theme', 'rewards', 'points',
                  'streak', 'last_active', 'vacation', 'sort_order'];

  // Build the SET clause dynamically from whatever fields were sent
  const updates = [];
  const values  = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.params.id);
  db.prepare(`UPDATE children SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM children WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/children/:id — remove a child and all their data (cascade handles the rest)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(req.params.id);
  if (!child) return res.status(404).json({ error: 'Child not found' });

  db.prepare(`DELETE FROM children WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

module.exports = router;