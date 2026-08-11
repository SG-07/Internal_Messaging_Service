import supabaseAdmin from '../config/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.sb_access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Attach the authenticated user to the request for downstream handlers
  req.user = data.user;
  next();
};

export const requireAdmin = async (req, res, next) => {
  // Must run AFTER requireAuth, since it relies on req.user being set
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !profile) {
    return res.status(500).json({ error: 'Failed to verify permissions' });
  }

  if (profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};