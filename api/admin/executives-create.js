// api/admin/executives-create.js — POST: add, PATCH: edit, DELETE: remove an executive
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const VALID_CATEGORIES = ['rec', 'zec', 'lit', 'wds', 'sec', 'adhoc'];

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

// Auto-derive 2-letter initials from a name when the admin leaves the field blank,
// e.g. "James Hope Arthur" -> "JA" (first + last name initial).
function deriveInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

module.exports = async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (!verifyToken(cookies['arsrc_session'], process.env.SESSION_SECRET)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // ── PATCH: edit an existing executive ────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, category, subgroup, name, role, school, initials, photo_url } = req.body || {};

    if (!id) return res.status(400).json({ error: 'id is required.' });
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid committee/body selected.' });
    }
    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
    if (role !== undefined && !role.trim()) return res.status(400).json({ error: 'Role cannot be empty.' });
    if (category && category !== 'rec' && subgroup !== undefined && !subgroup.trim()) {
      return res.status(400).json({ error: 'Sub-group / committee name is required for this category.' });
    }

    // Only update fields the client actually sent — this is a partial update,
    // not a full overwrite, so omitted fields keep their existing DB value.
    const updates = {};
    if (category !== undefined) updates.category = category;
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role.trim();
    if (school !== undefined) updates.school = school.trim() || null;
    if (initials !== undefined) updates.initials = (initials.trim() || deriveInitials(name || '')).slice(0, 4).toUpperCase();
    if (photo_url !== undefined) updates.photo_url = photo_url.trim() || null;
    if (subgroup !== undefined) {
      updates.subgroup = (category === 'rec' || (category === undefined && subgroup === '')) ? null : subgroup.trim();
    }
    // If category is being changed to 'rec', force subgroup to null regardless
    if (category === 'rec') updates.subgroup = null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    const { data, error } = await supabase.from('executives').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('[ARSRC Admin] Failed to update executive:', error);
      return res.status(500).json({ error: 'Could not save changes. Try again.' });
    }

    return res.status(200).json({ success: true, executive: data });
  }

  // ── DELETE: remove an executive ──────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required.' });

    const { error } = await supabase.from('executives').delete().eq('id', id);

    if (error) {
      console.error('[ARSRC Admin] Failed to delete executive:', error);
      return res.status(500).json({ error: 'Could not delete executive. Try again.' });
    }

    return res.status(200).json({ success: true });
  }

  // ── POST: add an executive ───────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { category, subgroup, name, role, school, initials, photo_url } = req.body || {};

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid committee/body selected.' });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!role?.trim()) return res.status(400).json({ error: 'Role is required.' });
  // REC is the one flat category with no sub-group heading (matches the site layout);
  // every other category is rendered under a named sub-committee.
  if (category !== 'rec' && !subgroup?.trim()) {
    return res.status(400).json({ error: 'Sub-group / committee name is required for this category.' });
  }

  const groupSubgroup = category === 'rec' ? null : subgroup.trim();

  // New entries go to the bottom of their (category, subgroup) group by
  // default — existing manually-arranged order is left untouched.
  let nextSortOrder = 0;
  {
    let query = supabase.from('executives').select('sort_order').eq('category', category);
    query = groupSubgroup === null ? query.is('subgroup', null) : query.eq('subgroup', groupSubgroup);
    const { data: existing, error: existingErr } = await query.order('sort_order', { ascending: false }).limit(1);
    if (!existingErr && existing && existing.length) nextSortOrder = existing[0].sort_order + 1;
  }

  const record = {
    category,
    subgroup: groupSubgroup,
    name: name.trim(),
    role: role.trim(),
    school: school?.trim() || null,
    initials: (initials?.trim() || deriveInitials(name)).slice(0, 4).toUpperCase(),
    sort_order: nextSortOrder,
    ...(photo_url ? { photo_url: photo_url.trim() } : {}),
  };

  const { data, error } = await supabase.from('executives').insert([record]).select().single();

  if (error) {
    console.error('[ARSRC Admin] Failed to create executive:', error);
    return res.status(500).json({ error: 'Could not save executive. Try again.' });
  }

  return res.status(201).json({ success: true, executive: data });
};
