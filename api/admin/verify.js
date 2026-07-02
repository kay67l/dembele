// api/admin/verify.js — Phase 2: Session verification
// Called by admin pages on load. Returns 200 if session is valid, 401 if not.

const crypto = require('crypto');

function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';')
      .map(c => c.trim().split('='))
      .filter(p => p.length === 2)
      .map(([k, v]) => [k.trim(), decodeURIComponent(v.trim())])
  );
}

function verifyToken(token, secret) {
  if (!token || !secret) return false;

  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [expiry, hmac] = parts;

  // Check expiry first
  if (Date.now() > parseInt(expiry, 10)) return false;

  // Recompute HMAC and compare using timing-safe comparison
  // (prevents timing attacks that could leak the secret)
  const expected = crypto.createHmac('sha256', secret).update(expiry).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac,     'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false; // buffers different lengths = tampered token
  }
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server configuration error.' });

  const cookies = parseCookies(req.headers.cookie);
  const token   = cookies['arsrc_session'];

  if (!verifyToken(token, secret)) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true });
};
