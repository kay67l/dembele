// api/admin/logout.js — Phase 2: Session logout
// Clears the session cookie. Simple and deliberate.

module.exports = function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  res.setHeader('Set-Cookie',
    'arsrc_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  );

  return res.status(200).json({ success: true });
};
