// api/admin/messages.js — Phase 2 stub, expanded in Phase 4
// Returns recent contact messages for the admin dashboard.
// Protected — requires valid session cookie.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  if (Date.now() > parseInt(expiry, 10)) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiry).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  // Verify session
  const cookies = parseCookies(req.headers.cookie);
  if (!verifyToken(cookies['arsrc_session'], process.env.SESSION_SECRET)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // Fetch recent messages from Supabase
  const { data, error, count } = await supabase
    .from('contact_messages')
    .select('id, name, email, subject, message, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[ARSRC Admin] Failed to fetch messages:', error);
    return res.status(500).json({ error: 'Could not load messages.' });
  }

  return res.status(200).json({ messages: data, total: count });
};
