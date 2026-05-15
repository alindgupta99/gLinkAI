require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const path           = require('path');
const db             = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'admin123';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: process.env.SESSION_SECRET || 'glink_ai_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));

// ── Auth guard ──────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// ── Public: submit contact form ─────────────────────────────────────────────
app.post('/api/contacts', async (req, res) => {
  const { name, phone, email, profession, city, service, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }
  try {
    const contact = await db.insertContact({ name, phone, email, profession, city, service, message });
    res.status(201).json({ ok: true, contact });
  } catch (err) {
    console.error('Insert error:', err.message);
    res.status(500).json({ error: 'Failed to save contact.' });
  }
});

// ── Admin: login ────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong password.' });
});

// ── Admin: check session ────────────────────────────────────────────────────
app.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ── Admin: logout ───────────────────────────────────────────────────────────
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ── Admin: get all contacts ─────────────────────────────────────────────────
app.get('/api/admin/contacts', requireAdmin, async (_req, res) => {
  try {
    const contacts = await db.getAllContacts();
    res.json(contacts);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// ── Admin: toggle contacted ─────────────────────────────────────────────────
app.patch('/api/admin/contacts/:id/contacted', requireAdmin, async (req, res) => {
  try {
    const contact = await db.toggleContacted(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found.' });
    res.json(contact);
  } catch (err) {
    console.error('Toggle error:', err.message);
    res.status(500).json({ error: 'Failed to update.' });
  }
});

// ── Admin: delete contact ───────────────────────────────────────────────────
app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteContact(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete.' });
  }
});

// ── Serve admin panel ───────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
db.initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Glink.ai server running → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
