const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');

// GET /api/rewards?child_id=1
router.get('/', (req, res) => {
  const db = getDb();
  const { child_id } = req.query;
  if (!child_id) return res.status(400).json({ error: 'child_id is required' });

  const rewards = db.prepare(`
    SELECT * FROM rewards WHERE child_id = ? AND active = 1 ORDER BY cost, id
  `).all(child_id);

  res.json(rewards);
});

// POST /api/rewards — create a reward
router.post('/', (req, res) => {
  const db = getDb();
  const { child_id, name, cost, icon } = req.body;

  if (!child_id || !name) return res.status(400).json({ error: 'child_id and name are required' });

  const result = db.prepare(`
    INSERT INTO rewards (child_id, name, cost, icon)
    VALUES (?, ?, ?, ?)
  `).run(child_id, name, cost || 10, icon || '🎁');

  const reward = db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json(reward);
});

// PATCH /api/rewards/:id
router.patch('/:id', (req, res) => {
  const db     = getDb();
  const reward = db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(req.params.id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const fields  = ['name', 'cost', 'icon', 'active'];
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
  db.prepare(`UPDATE rewards SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/rewards/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM rewards WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

// POST /api/rewards/:id/redeem — child redeems a reward
router.post('/:id/redeem', (req, res) => {
  const db     = getDb();
  const { child_id } = req.body;
  const reward = db.prepare(`SELECT * FROM rewards WHERE id = ?`).get(req.params.id);

  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const child = db.prepare(`SELECT * FROM children WHERE id = ?`).get(child_id);
  if (!child)  return res.status(404).json({ error: 'Child not found' });

  if (child.points < reward.cost) {
    return res.status(400).json({ error: 'Not enough points' });
  }

  // Deduct points and log the redemption in a single transaction
  const redeem = db.transaction(() => {
    db.prepare(`UPDATE children SET points = points - ? WHERE id = ?`).run(reward.cost, child_id);
    db.prepare(`
      INSERT INTO redemptions (reward_id, child_id, points_spent)
      VALUES (?, ?, ?)
    `).run(reward.id, child_id, reward.cost);
  });

  redeem();

  const updated = db.prepare(`SELECT * FROM children WHERE id = ?`).get(child_id);
  res.json({ success: true, points: updated.points });
});

module.exports = router;