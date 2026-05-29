require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  await sql`
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
  `;
  console.log('Database ready.');
}

async function insertContact({ name, phone, email, profession, city, service, message }) {
  const rows = await sql`
    INSERT INTO contacts (name, phone, email, profession, city, service, message)
    VALUES (${name}, ${phone}, ${email ?? null}, ${profession ?? null}, ${city ?? null}, ${service ?? null}, ${message ?? null})
    RETURNING *
  `;
  return rows[0];
}

async function getAllContacts() {
  return sql`SELECT * FROM contacts ORDER BY created_at DESC`;
}

async function toggleContacted(id) {
  const rows = await sql`
    UPDATE contacts SET contacted = NOT contacted WHERE id = ${id} RETURNING *
  `;
  return rows[0];
}

async function deleteContact(id) {
  await sql`DELETE FROM contacts WHERE id = ${id}`;
}

async function initWhatsappTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id           SERIAL PRIMARY KEY,
      event_type   VARCHAR(20)  NOT NULL,
      message_id   VARCHAR(255),
      recipient    VARCHAR(50),
      status       VARCHAR(20),
      error        TEXT,
      from_number  VARCHAR(50),
      message_text TEXT,
      message_type VARCHAR(50),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function insertWhatsappEvent({ event_type, message_id, recipient, status, error, from_number, message_text, message_type }) {
  const rows = await sql`
    INSERT INTO whatsapp_messages (event_type, message_id, recipient, status, error, from_number, message_text, message_type)
    VALUES (${event_type}, ${message_id ?? null}, ${recipient ?? null}, ${status ?? null}, ${error ?? null}, ${from_number ?? null}, ${message_text ?? null}, ${message_type ?? null})
    RETURNING *
  `;
  return rows[0];
}

async function getWhatsappMessages() {
  return sql`SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 500`;
}

module.exports = { initDB, insertContact, getAllContacts, toggleContacted, deleteContact, initWhatsappTable, insertWhatsappEvent, getWhatsappMessages };
