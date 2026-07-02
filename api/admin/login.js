// api/admin/login.js — Phase 2: Admin authentication
// Verifies password against bcrypt hash, issues HMAC-signed session cookie

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ─── In-memory rate limiting ─────────────────────────────────────────────────
// Resets on cold start. Acceptable for this use case — the alternative is Redis.
// Limits to 5 failed attempts per IP per 15 minutes.
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000;

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
}

function isRateLimited(ip) {
  const r = attempts.get(ip);
  if (!r) return false;
  if (Date.now() - r.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return r.count >= MAX_ATTEMPTS;
}

function recordFail(ip) {
  const r = attempts.get(ip) || { count: 0, first: Date.now() };
  r.count++;
  attempts.set(ip, r);
}

function clearAttempts(ip) { attempts.delete(ip); }

// ─── Session token ────────────────────────────────────────────────────────────
// Format: "{expiry_ms}:{hmac_hex}"
// HMAC is computed over the expiry timestamp using SESSION_SECRET.
// Stateless — no database lookup needed to verify.
function createToken(secret) {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const hmac   = crypto.createHmac('sha256', secret).update(String(expiry)).digest('hex');
  return `${expiry}:${hmac}`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const ip   = getIP(req);
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.SESSION_SECRET;

  // Guard: env vars missing
  if (!hash || !secret) {
    console.error('[ARSRC Admin] ADMIN_PASSWORD_HASH or SESSION_SECRET not set.');
    return res.status(500).json({ error: 'Server configuration error. Contact the web admin.' });
  }

  // Guard: rate limit
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many failed attempts. Try again in 15 minutes.'
    });
  }

  const { password } = req.body || {};

  if (!password?.trim()) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  // Verify against bcrypt hash
  const valid = await bcrypt.compare(password, hash);

  if (!valid) {
    recordFail(ip);
    const remaining = MAX_ATTEMPTS - (attempts.get(ip)?.count || 0);
    return res.status(401).json({
      error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    });
  }

  // Success — clear rate limit, issue cookie
  clearAttempts(ip);

  const token = createToken(secret);

  res.setHeader('Set-Cookie',
    `arsrc_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24}`
  );

  return res.status(200).json({ success: true });
};
