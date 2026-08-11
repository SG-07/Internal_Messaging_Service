// backend/src/controllers/auth.js

import supabaseAdmin from '../config/supabaseClient.js';

// --- SIGNUP ---
export const signup = async (req, res) => {
  const { email, password, fullName, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ 
      error: 'Email, password, and username are required' 
    });
  }

  // Check if username already exists
  const { data: existingUsername, error: usernameError } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingUsername) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  if (usernameError && usernameError.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to check username availability' });
  }

  // Check if email already exists in profiles
  const { data: existingEmail, error: emailError } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  if (emailError && emailError.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to check email availability' });
  }

  // Create the auth user with username in metadata
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
        username: username,
      },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    message: 'Signup successful. Please check your email to confirm your account.',
    user: data.user,
  });
};

// --- LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  const { session, user } = data;

  // Store the Supabase access token in an httpOnly cookie —
  // JS on the frontend can't read it, which protects against XSS token theft.
  res.cookie('sb_access_token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: session.expires_in * 1000,
  });

  res.cookie('sb_refresh_token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Fetch the profile (includes role) to send back to frontend
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, username, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return res.status(500).json({ error: 'Logged in but failed to load profile' });
  }

  res.status(200).json({ message: 'Login successful', user: profile });
};

// --- LOGOUT ---
export const logout = async (req, res) => {
  res.clearCookie('sb_access_token');
  res.clearCookie('sb_refresh_token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// --- GET CURRENT USER ---
export const getCurrentUser = async (req, res) => {
  // req.user is set by the requireAuth middleware (Step 7)
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, username, role')
    .eq('id', req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }

  res.status(200).json({ user: profile });
};