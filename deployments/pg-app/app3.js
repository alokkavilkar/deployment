const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const writeClient = new Client({
  host: 'postgres-0.postgres.default.svc.cluster.local',
  port: 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

const readClient = new Client({
  host: 'postgres-1.postgres.default.svc.cluster.local',
  port: 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});
async function initDB() {
  try {
    await writeClient.connect();
    console.log("✅ Connected to postgres-0 (write)");

    await readClient.connect();
    console.log("✅ Connected to postgres-1 (read)");

    await writeClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    console.log("🛠️ Users table initialized");
  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
}

// ➕ POST /users → insert user using postgres-0
app.post('/users', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await writeClient.query(
      'INSERT INTO users(name) VALUES($1) RETURNING *',
      [name]
    );
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows[0], null, 2) + '\n');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📤 GET /users → read users from postgres-1
app.get('/users', async (req, res) => {
  try {
    const result = await readClient.query('SELECT * FROM users');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2) + '\n');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
  initDB();
});

