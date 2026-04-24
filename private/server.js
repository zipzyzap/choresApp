require('dotenv').config();
const express = require('express');
const path    = require('path');
const { setupDatabase } = require('./database');

// Boot the database — creates tables and seeds defaults if needed
setupDatabase();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/children',    require('./routes/children'));
app.use('/api/columns',     require('./routes/columns'));
app.use('/api/items',       require('./routes/items'));
app.use('/api/completions', require('./routes/completions'));
app.use('/api/rewards',     require('./routes/rewards'));
app.use('/api/settings',    require('./routes/settings'));

// ─── Catch-all — serve the SPA for any non-API route ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chores app running on port ${PORT}`);
});