import jwt from 'jsonwebtoken';
import supabaseAdmin from '../config/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
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

export const requireManagerOrAdmin = async (req, res, next) => {
  // Must run AFTER requireAuth
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();
  if (error || !profile) {
    return res.status(500).json({ error: 'Failed to verify permissions' });
  }
  if (profile.role !== 'manager' && profile.role !== 'admin') {
    return res.status(403).json({ error: 'Manager or admin access required' });
  }
  req.userRole = profile.role; // stash for controllers that need to branch on exact role
  next();
};