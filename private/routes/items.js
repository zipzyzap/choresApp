const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');

// GET /api/items?column_id=1 — all items in a column
router.get('/', (req, res) => {
  const db = getDb();
  const { column_id } = req.query;
  if (!column_id) return res.status(400).json({ error: 'column_id is required' });

  const items = db.prepare(`
    SELECT * FROM items
    WHERE column_id = ?
    ORDER BY sort_order, id
  `).all(column_id);

  res.json(items);
});

// POST /api/items — add an item to a column
router.post('/', (req, res) => {
  const db = getDb();
  const { column_id, name, frequency, frequency_day, points_value, optional } = req.body;

  if (!column_id || !name) return res.status(400).json({ error: 'column_id and name are required' });

  const last = db.prepare(`
    SELECT MAX(sort_order) as max FROM items WHERE column_id = ?
  `).get(column_id);
  const sort_order = (last.max ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO items (column_id, name, frequency, frequency_day, points_value, optional, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    column_id,
    name,
    frequency     || 'daily',
    frequency_day || null,
    points_value  || 1,
    optional      ? 1 : 0,
    sort_order
  );

  const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(item);
});

// PATCH /api/items/:id — update item fields
router.patch('/:id', (req, res) => {
  const db   = getDb();
  const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const fields  = ['name', 'frequency', 'frequency_day', 'points_value', 'optional', 'sort_order'];
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
  db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM items WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  const db   = getDb();
  const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare(`DELETE FROM items WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

module.exports = router;