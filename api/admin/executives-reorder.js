// api/admin/executives-reorder.js — Move an executive up/down within its
// (category, subgroup) group by swapping sort_order with its neighbor.
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

  const { id, direction } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required.' });
  if (direction !== 'up' && direction !== 'down') {
    return res.status(400).json({ error: 'direction must be "up" or "down".' });
  }

  // Fetch the target row to know which group it belongs to
  const { data: target, error: targetErr } = await supabase
    .from('executives')
    .select('id, category, subgroup, sort_order')
    .eq('id', id)
    .single();

  if (targetErr || !target) {
    return res.status(404).json({ error: 'Executive not found.' });
  }

  // Fetch the full ordered group so we know the correct neighbor even if
  // sort_order values have gaps or ties (e.g. two rows added at once)
  let groupQuery = supabase
    .from('executives')
    .select('id, sort_order')
    .eq('category', target.category);
  groupQuery = target.subgroup === null
    ? groupQuery.is('subgroup', null)
    : groupQuery.eq('subgroup', target.subgroup);

  const { data: group, error: groupErr } = await groupQuery
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (groupErr || !group) {
    return res.status(500).json({ error: 'Could not load group for reordering.' });
  }

  const idx = group.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Executive not found in its group.' });

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= group.length) {
    // Already at the top/bottom — not an error, just nothing to do
    return res.status(200).json({ success: true, moved: false });
  }

  const a = group[idx];
  const b = group[swapIdx];

  // Swap sort_order between the two rows
  const { error: err1 } = await supabase.from('executives').update({ sort_order: b.sort_order }).eq('id', a.id);
  const { error: err2 } = await supabase.from('executives').update({ sort_order: a.sort_order }).eq('id', b.id);

  if (err1 || err2) {
    console.error('[ARSRC Admin] Failed to reorder executives:', err1 || err2);
    return res.status(500).json({ error: 'Could not reorder. Try again.' });
  }

  return res.status(200).json({ success: true, moved: true });
};
