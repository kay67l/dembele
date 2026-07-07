// api/admin/posts-create.js — POST: create a new blog post
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
function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim() + '-' + Date.now();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const cookies = parseCookies(req.headers.cookie);
  if (!verifyToken(cookies['arsrc_session'], process.env.SESSION_SECRET)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const { title, excerpt, content, category, author, image_url } = req.body || {};

  if (!title?.trim())   return res.status(400).json({ error: 'Title is required.' });
  if (!excerpt?.trim()) return res.status(400).json({ error: 'Excerpt is required.' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required.' });
  if (excerpt.trim().length > 280) return res.status(400).json({ error: 'Excerpt must be 280 characters or less.' });

  const post = {
    title:    title.trim(),
    excerpt:  excerpt.trim(),
    content:  content.trim(),
    category: category?.trim() || 'News',
    author:   author?.trim()   || 'ARSRC Council',
    slug:     slugify(title.trim()),
    published: true,
    ...(image_url ? { image_url: image_url.trim() } : {}),
  };

  const { data, error } = await supabase.from('blog_posts').insert([post]).select().single();

  if (error) {
    console.error('[ARSRC Admin] Failed to create post:', error);
    return res.status(500).json({ error: 'Could not save post. Try again.' });
  }

  return res.status(201).json({ success: true, post: data });
};
