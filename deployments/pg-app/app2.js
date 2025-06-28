const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// DB connection pool
const pool = new Pool({
  host: process.env.PGHOST || 'postgres-0.postgres.default.svc.cluster.local',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgresql2',
  database: process.env.PGDATABASE || 'mydb',
  port: 5432,
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  )
`, (err) => {
  if (err) console.error('Table init failed:', err);
  else console.log('Users table is ready');
});

// Create user
app.post('/users', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO users(name) VALUES($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on port ${port}`));

