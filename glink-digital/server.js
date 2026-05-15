require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const crypto       = require('crypto');
const path         = require('path');
const db           = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.SESSION_SECRET || 'glink_ai_secret';
const COOKIE = 'glink_admin';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// ── Signed-cookie auth (stateless — works on serverless) ────────────────────
function makeToken() {
  const payload = Date.now().toString();
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

function validToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const dot = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, dot);
    const sig     = decoded.slice(dot + 1);
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return sig === expected;
  } catch { return false; }
}

function requireAdmin(req, res, next) {
  if (validToken(req.cookies[COOKIE])) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// ── Ensure DB is ready before any request (safe for serverless cold starts) ─
const dbReady = db.initDB().catch(err => {
  console.error('DB init failed:', err.message);
});

app.use(async (_req, _res, next) => {
  await dbReady;
  next();
});

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
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  res.cookie(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  });
  res.json({ ok: true });
});

// ── Admin: check session ────────────────────────────────────────────────────
app.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: validToken(req.cookies[COOKIE]) });
});

// ── Admin: logout ───────────────────────────────────────────────────────────
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

// ── Admin: get all contacts ─────────────────────────────────────────────────
app.get('/api/admin/contacts', requireAdmin, async (_req, res) => {
  try {
    res.json(await db.getAllContacts());
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

// ── Serve main site ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Local dev: listen on port ───────────────────────────────────────────────
if (require.main === module) {
  db.initDB().then(() => {
    app.listen(PORT, () => console.log(`Glink.ai running → http://localhost:${PORT}`));
  }).catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
}

// ── Vercel: export app as serverless handler ────────────────────────────────
module.exports = app;
