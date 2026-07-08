// api/admin/executives-archive.js — Copies every row currently in `executives`
// into `past_executives`, tagged with the given year. Never modifies or
// deletes anything in `executives` — this is a one-way snapshot, not a move.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map(c => c.trim().split('=')).filter(p => p.length === 2).map(([k,v]) => [k.trim(), decodeURIComponent(v.trim())]));
}
function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [expiry, hmac] = parts;
  if (Date.now() > parseInt(expiry, 10)) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiry).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex')); } catch { return false; }
}

module.exports = async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (!verifyToken(cookies['arsrc_session'], process.env.SESSION_SECRET)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { year } = req.body || {};
  if (!year?.trim()) {
    return res.status(400).json({ error: 'Year label is required (e.g. "2024/2025").' });
  }
  const yearLabel = year.trim();

  // Guard against accidental double-archiving of the same year
  const { count: existingCount, error: countErr } = await supabase
    .from('past_executives')
    .select('id', { count: 'exact', head: true })
    .eq('year', yearLabel);

  if (countErr) {
    console.error('[ARSRC Admin] Failed to check existing archive:', countErr);
    return res.status(500).json({ error: 'Could not check for an existing archive under this year.' });
  }
  if (existingCount && existingCount > 0) {
    return res.status(409).json({
      error: `"${yearLabel}" has already been archived (${existingCount} entries). Delete that year first if you want to re-archive it, or use a different year label.`,
    });
  }

  const { data: current, error: fetchErr } = await supabase
    .from('executives')
    .select('category, subgroup, name, role, school, initials, photo_url, sort_order');

  if (fetchErr) {
    console.error('[ARSRC Admin] Failed to read current executives for archiving:', fetchErr);
    return res.status(500).json({ error: 'Could not read current executives.' });
  }
  if (!current || current.length === 0) {
    return res.status(400).json({ error: 'There are no current executives to archive.' });
  }

  const snapshot = current.map(ex => ({ ...ex, year: yearLabel }));

  const { error: insertErr } = await supabase.from('past_executives').insert(snapshot);
  if (insertErr) {
    console.error('[ARSRC Admin] Failed to archive executives:', insertErr);
    return res.status(500).json({ error: 'Could not save the archive. Try again.' });
  }

  return res.status(201).json({ success: true, archived: snapshot.length, year: yearLabel });
};
