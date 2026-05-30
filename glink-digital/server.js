require('dotenv').config();
const express      = require('express');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const crypto       = require('crypto');
const path         = require('path');
const db           = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.SESSION_SECRET || 'glink_ai_secret';
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'glink_webhook_secret';
const COOKIE = 'glink_admin';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Security & trust headers (ranking signal + clickjacking protection)
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    } else if (/\.(css|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(jpe?g|png|webp|svg|ico|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

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

// ── Serve sitemap & robots before DB init (never block crawlers on cold start) ─
app.get('/sitemap.xml', (_req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ── Ensure DB is ready before any request (safe for serverless cold starts) ─
const dbReady = Promise.all([db.initDB(), db.initWhatsappTable()]).catch(err => {
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

// ── WhatsApp webhook: Meta verification ────────────────────────────────────
app.get('/api/webhook/whatsapp', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── WhatsApp webhook: receive events ───────────────────────────────────────
app.post('/api/webhook/whatsapp', async (req, res) => {
  res.sendStatus(200); // acknowledge immediately — Meta retries if you don't
  const body = req.body;
  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const s of value.statuses || []) {
          await db.insertWhatsappEvent({
            event_type:   'status',
            message_id:   s.id,
            recipient:    s.recipient_id,
            status:       s.status,
            error:        s.errors?.[0]?.title ?? null,
          });
        }
        for (const m of value.messages || []) {
          await db.insertWhatsappEvent({
            event_type:   'incoming',
            message_id:   m.id,
            from_number:  m.from,
            message_text: m.text?.body ?? null,
            message_type: m.type,
          });
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }
});

// ── Admin: get WhatsApp message logs ───────────────────────────────────────
app.get('/api/admin/whatsapp-messages', requireAdmin, async (req, res) => {
  try {
    const { status, sort } = req.query;
    res.json(await db.getWhatsappMessages({ status, sort }));
  } catch (err) {
    console.error('WhatsApp fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch WhatsApp messages.' });
  }
});

// ── Serve admin panel ───────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Serve main site ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
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
