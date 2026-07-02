// api/admin/posts.js — Phase 3: Admin blog post management
// GET    → list all posts (including unpublished) for admin view
// POST   → create new post
// DELETE → delete post by id
// All methods require a valid admin session cookie.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Auth helpers (duplicated from verify.js — no shared modules in Vercel) ──
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

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifyToken(cookies['arsrc_session'], process.env.SESSION_SECRET);
}

// ─── Slug generation ──────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now(); // timestamp suffix ensures uniqueness
}

// ─── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // ── GET: list all posts ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, category, slug, published, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ARSRC Admin] Failed to fetch posts:', error);
      return res.status(500).json({ error: 'Could not load posts.' });
    }

    return res.status(200).json({ posts: data, total: count });
  }

  // ── POST: create new post ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, excerpt, content, category, author } = req.body || {};

    // Validate
    if (!title?.trim())   return res.status(400).json({ error: 'Title is required.' });
    if (!excerpt?.trim()) return res.status(400).json({ error: 'Excerpt is required.' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required.' });
    if (excerpt.trim().length > 280) {
      return res.status(400).json({ error: 'Excerpt must be 280 characters or less.' });
    }

    const post = {
      title:    title.trim(),
      excerpt:  excerpt.trim(),
      content:  content.trim(),
      category: category?.trim() || 'News',
      author:   author?.trim()   || 'ARSRC Council',
      slug:     slugify(title.trim()),
      published: true,
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([post])
      .select()
      .single();

    if (error) {
      console.error('[ARSRC Admin] Failed to create post:', error);
      return res.status(500).json({ error: 'Could not save post. Try again.' });
    }

    return res.status(201).json({ success: true, post: data });
  }

  // ── DELETE: remove post by id ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};

    if (!id) return res.status(400).json({ error: 'Post ID is required.' });

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ARSRC Admin] Failed to delete post:', error);
      return res.status(500).json({ error: 'Could not delete post.' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
