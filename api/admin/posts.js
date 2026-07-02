// api/posts.js — Phase 3: Public posts endpoint
// Called by the news section on index.html. No auth required — public data.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  // Cache at CDN level for 60s, serve stale for up to 5min while revalidating
  // This means the news section is fast for visitors without hammering Supabase
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, excerpt, author, category, slug, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6); // Show latest 6 on the homepage

  if (error) {
    console.error('[ARSRC] Failed to fetch posts:', error);
    return res.status(500).json({ error: 'Could not load posts.' });
  }

  return res.status(200).json({ posts: data });
};
