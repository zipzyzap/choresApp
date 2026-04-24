const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');

// GET /api/completions?child_id=1&date=2026-04-09
router.get('/', (req, res) => {
  const db = getDb();
  const { child_id, date } = req.query;
  if (!child_id || !date) return res.status(400).json({ error: 'child_id and date are required' });

  const completions = db.prepare(`
    SELECT * FROM completions WHERE child_id = ? AND date = ?
  `).all(child_id, date);

  res.json(completions);
});

// POST /api/completions — mark an item complete or skipped
router.post('/', (req, res) => {
  const db = getDb();
  const { item_id, child_id, date, skipped } = req.body;

  if (!item_id || !child_id || !date) {
    return res.status(400).json({ error: 'item_id, child_id, and date are required' });
  }

  db.prepare(`
    INSERT INTO completions (item_id, child_id, date, completed, skipped, completed_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
    ON CONFLICT(item_id, child_id, date)
    DO UPDATE SET completed = 1, skipped = ?, completed_at = datetime('now')
  `).run(item_id, child_id, date, skipped ? 1 : 0, skipped ? 1 : 0);

  // Award points if applicable
  if (!skipped) {
    const item = db.prepare(`
      SELECT i.points_value, c.points_eligible, ch.rewards
      FROM items i
      JOIN columns c   ON c.id = i.column_id
      JOIN children ch ON ch.id = ?
      WHERE i.id = ?
    `).get(child_id, item_id);

    if (item && item.rewards && item.points_eligible) {
      db.prepare(`
        UPDATE children SET points = points + ? WHERE id = ?
      `).run(item.points_value, child_id);
    }
  }

  updateStreak(db, child_id, date);

  const completion = db.prepare(`
    SELECT * FROM completions WHERE item_id = ? AND child_id = ? AND date = ?
  `).get(item_id, child_id, date);

  res.status(201).json(completion);
});

// DELETE /api/completions — un-complete an item
router.delete('/', (req, res) => {
  const db = getDb();
  const { item_id, child_id, date } = req.body;

  if (!item_id || !child_id || !date) {
    return res.status(400).json({ error: 'item_id, child_id, and date are required' });
  }

  // Deduct points if applicable before removing
  const existing = db.prepare(`
    SELECT * FROM completions WHERE item_id = ? AND child_id = ? AND date = ?
  `).get(item_id, child_id, date);

  if (existing && !existing.skipped) {
    const item = db.prepare(`
      SELECT i.points_value, c.points_eligible, ch.rewards
      FROM items i
      JOIN columns c   ON c.id = i.column_id
      JOIN children ch ON ch.id = ?
      WHERE i.id = ?
    `).get(child_id, item_id);

    if (item && item.rewards && item.points_eligible) {
      db.prepare(`
        UPDATE children SET points = MAX(0, points - ?) WHERE id = ?
      `).run(item.points_value, child_id);
    }
  }

  db.prepare(`
    DELETE FROM completions WHERE item_id = ? AND child_id = ? AND date = ?
  `).run(item_id, child_id, date);

  res.json({ success: true });
});

// GET /api/completions/log?child_id=1&limit=30
router.get('/log', (req, res) => {
  const db = getDb();
  const { child_id, limit = 30 } = req.query;
  if (!child_id) return res.status(400).json({ error: 'child_id is required' });

  const log = db.prepare(`
    SELECT c.*, i.name as item_name, col.name as column_name
    FROM completions c
    JOIN items   i   ON i.id   = c.item_id
    JOIN columns col ON col.id = i.column_id
    WHERE c.child_id = ?
    ORDER BY c.completed_at DESC
    LIMIT ?
  `).all(child_id, Number(limit));

  res.json(log);
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function updateStreak(db, child_id, date) {
  // If the child is on vacation, protect the streak — don't increment or break it
  const child = db.prepare(`SELECT vacation FROM children WHERE id = ?`).get(child_id);
  if (child?.vacation) return;

  const required = db.prepare(`
    SELECT COUNT(*) as total
    FROM items i
    JOIN columns col ON col.id = i.column_id
    WHERE col.child_id = ? AND i.optional = 0
      AND (i.frequency = 'daily'
        OR (i.frequency = 'weekdays' AND strftime('%w', ?) NOT IN ('0','6'))
        OR (i.frequency = 'weekends' AND strftime('%w', ?) IN ('0','6'))
        OR (i.frequency = 'weekly'   AND lower(i.frequency_day) = lower(strftime('%A', ?)))
        OR (i.frequency = 'specific' AND instr(lower(i.frequency_day), lower(strftime('%A', ?))) > 0)
      )
  `).get(child_id, date, date, date, date);

  const completed = db.prepare(`
    SELECT COUNT(*) as total
    FROM completions
    WHERE child_id = ? AND date = ? AND completed = 1 AND skipped = 0
  `).get(child_id, date);

  if (required.total > 0 && completed.total >= required.total) {
    db.prepare(`
      UPDATE children SET streak = streak + 1, last_active = ? WHERE id = ?
    `).run(date, child_id);
  }
}

module.exports = router;