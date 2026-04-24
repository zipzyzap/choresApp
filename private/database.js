const Database = require('better-sqlite3');
const path = require('path');

// Database lives in /data so it persists outside the container
const DB_PATH = path.join(__dirname, '../data/chores.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // WAL mode is faster and safer for concurrent reads
    db.pragma('journal_mode = WAL');
    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function setupDatabase() {
  const db = getDb();

  db.exec(`

    -- ─────────────────────────────────────────
    -- Children
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS children (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      avatar        TEXT    NOT NULL DEFAULT '😊',
      accent        TEXT    NOT NULL DEFAULT '#4A90D9',
      theme         TEXT    NOT NULL DEFAULT 'default',
      rewards       INTEGER NOT NULL DEFAULT 0,
      points        INTEGER NOT NULL DEFAULT 0,
      streak        INTEGER NOT NULL DEFAULT 0,
      last_active   TEXT,
      vacation      INTEGER NOT NULL DEFAULT 0,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- Columns (fully customizable per child)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS columns (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id        INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name            TEXT    NOT NULL,
      icon            TEXT    NOT NULL DEFAULT '📋',
      points_eligible INTEGER NOT NULL DEFAULT 0,
      visible         INTEGER NOT NULL DEFAULT 1,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- Items (chores, tasks, responsibilities)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS items (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id      INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
      name           TEXT    NOT NULL,
      frequency      TEXT    NOT NULL DEFAULT 'daily',
      frequency_day  TEXT,
      points_value   INTEGER NOT NULL DEFAULT 1,
      optional       INTEGER NOT NULL DEFAULT 0,
      sort_order     INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- Completions (one row per item per day)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS completions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      child_id    INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      date        TEXT    NOT NULL,
      completed   INTEGER NOT NULL DEFAULT 1,
      skipped     INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(item_id, child_id, date)
    );

    -- ─────────────────────────────────────────
    -- Rewards (only relevant when rewards mode is on)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS rewards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id    INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      cost        INTEGER NOT NULL DEFAULT 10,
      icon        TEXT    NOT NULL DEFAULT '🎁',
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- Redemptions (reward claim history)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS redemptions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id    INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      child_id     INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      points_spent INTEGER NOT NULL,
      redeemed_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- Point adjustments (manual awards/deductions)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS point_adjustments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id    INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      amount      INTEGER NOT NULL,
      note        TEXT,
      adjusted_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- App settings (global key/value store)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL
    );

  `);

  // Seed default settings if they don't exist yet
  const defaults = [
    ['reset_time', '06:00'],
    ['pin', '1234'],
    ['pin_lockout_attempts', '5'],
    ['pin_timeout_minutes', '5'],
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of defaults) {
    insert.run(key, value);
  }

  console.log('Database ready');
}

// Wipe everything and rebuild — used by the reset route and dev script
function resetDatabase() {
  const db = getDb();

  db.exec(`
    DROP TABLE IF EXISTS redemptions;
    DROP TABLE IF EXISTS point_adjustments;
    DROP TABLE IF EXISTS completions;
    DROP TABLE IF EXISTS rewards;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS columns;
    DROP TABLE IF EXISTS children;
    DROP TABLE IF EXISTS settings;
  `);

  setupDatabase();
  console.log('Database reset complete');
}

module.exports = { getDb, setupDatabase, resetDatabase };