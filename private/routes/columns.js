const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');

// GET /api/columns?child_id=1 — all columns for a child
router.get('/', (req, res) => {
  const db = getDb();
  const { child_id } = req.query;
  if (!child_id) return res.status(400).json({ error: 'child_id is required' });

  const columns = db.prepare(`
    SELECT * FROM columns
    WHERE child_id = ? AND visible = 1
    ORDER BY sort_order, id
  `).all(child_id);

  res.json(columns);
});

// POST /api/columns — create a new column for a child
router.post('/', (req, res) => {
  const db = getDb();
  const { child_id, name, icon, points_eligible } = req.body;

  if (!child_id || !name) return res.status(400).json({ error: 'child_id and name are required' });

  const last = db.prepare(`
    SELECT MAX(sort_order) as max FROM columns WHERE child_id = ?
  `).get(child_id);
  const sort_order = (last.max ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO columns (child_id, name, icon, points_eligible, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    child_id,
    name,
    icon            || '📋',
    points_eligible ? 1 : 0,
    sort_order
  );

  const column = db.prepare(`SELECT * FROM columns WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(column);
});

// PATCH /api/columns/:id — update column fields
router.patch('/:id', (req, res) => {
  const db     = getDb();
  const column = db.prepare(`SELECT * FROM columns WHERE id = ?`).get(req.params.id);
  if (!column) return res.status(404).json({ error: 'Column not found' });

  const fields  = ['name', 'icon', 'points_eligible', 'visible', 'sort_order'];
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
  db.prepare(`UPDATE columns SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM columns WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/columns/:id
router.delete('/:id', (req, res) => {
  const db     = getDb();
  const column = db.prepare(`SELECT * FROM columns WHERE id = ?`).get(req.params.id);
  if (!column) return res.status(404).json({ error: 'Column not found' });

  db.prepare(`DELETE FROM columns WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

module.exports = router;