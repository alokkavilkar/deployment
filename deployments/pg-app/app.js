const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// PostgreSQL client
const client = new Client({
  host: 'localhost',  // you're port-forwarding from postgres-0
  port: 5432,
  user: 'postgres',
  password: 'postgresql2',
  database: 'mydb',
});

async function initDB() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    console.log("🛠️ Users table ready");
  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
}
// Add a user
app.post('/users', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await client.query('INSERT INTO users(name) VALUES($1) RETURNING *', [name]);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows[0], null, 2) + '\n');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all users
app.get('/users', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM users');
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

