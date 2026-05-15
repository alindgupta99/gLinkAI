require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'glink_ai',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      phone      VARCHAR(50)  NOT NULL,
      email      VARCHAR(255),
      profession VARCHAR(150),
      city       VARCHAR(100),
      service    VARCHAR(150),
      message    TEXT,
      contacted  BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
  console.log('Database ready.');
}

async function insertContact({ name, phone, email, profession, city, service, message }) {
  const { rows } = await pool.query(
    `INSERT INTO contacts (name, phone, email, profession, city, service, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, phone, email || null, profession || null, city || null, service || null, message || null]
  );
  return rows[0];
}

async function getAllContacts() {
  const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
  return rows;
}

async function toggleContacted(id) {
  const { rows } = await pool.query(
    `UPDATE contacts SET contacted = NOT contacted WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
}

async function deleteContact(id) {
  await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
}

module.exports = { initDB, insertContact, getAllContacts, toggleContacted, deleteContact };
